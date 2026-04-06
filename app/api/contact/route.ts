import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, sheetsGet } from "../../lib/google";

async function getContactEmail(): Promise<string> {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId    = process.env.GOOGLE_SHEETS_ID;
  if (!email || !privateKey || !sheetId) return "wchanhe@gmail.com";
  try {
    const token = await getAccessToken(email, privateKey);
    const rows  = await sheetsGet(token, sheetId, "About!A2:B50");
    const row   = rows.find((r) => r[0]?.toLowerCase() === "contact_email");
    return row?.[1]?.trim() || "wchanhe@gmail.com";
  } catch {
    return "wchanhe@gmail.com";
  }
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await req.json();
  const {
    name, companyName, email, phone,
    subject, budget, dueDate, displayRights, message,
    turnstileToken,
  } = body;

  // Verify Turnstile token
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret:   process.env.TURNSTILE_SECRET_KEY,
      response: turnstileToken ?? "",
    }),
  });
  const verifyData = await verifyRes.json() as { success: boolean };
  if (!verifyData.success) {
    return NextResponse.json({ success: false, error: "Bot verification failed" }, { status: 400 });
  }

  const subjectLabels: Record<string, string> = {
    commission: "Commission Inquiry",
    commercial: "Commercial Use",
    other: "Other",
  };

  const rows = [
    ["Name",                name],
    ["Company",             companyName || "—"],
    ["Email",               email],
    ["Phone",               phone || "—"],
    ["Subject",             subjectLabels[subject] ?? subject],
    ["Budget",              budget || "—"],
    ["Due Date",            dueDate || "—"],
    ["Artist Display Rights", displayRights ? "✓ Permitted" : "✗ Not permitted"],
    ["Message",             message],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;font-weight:600;background:#f5f5f5;border:1px solid #e0e0e0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="padding:8px 12px;border:1px solid #e0e0e0;white-space:pre-wrap">${value}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="font-size:18px;margin-bottom:20px">New Inquiry — MontBlanc</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${tableRows}
      </table>
      <p style="margin-top:20px;font-size:12px;color:#999">
        Sent from the MontBlanc contact form
      </p>
    </div>
  `;

  const contactEmail = await getContactEmail();

  const { error: sendError } = await resend.emails.send({
    from: "MontBlanc Contact <onboarding@resend.dev>",
    to: contactEmail,
    replyTo: email,
    subject: [
      `[${subjectLabels[subject] ?? subject}]`,
      name,
      companyName ? `/ ${companyName}` : null,
      dueDate ? `— Due: ${dueDate}` : null,
    ].filter(Boolean).join(" "),
    html,
  });

  if (sendError) {
    console.error("Email send error:", sendError);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  // Discord notification (best-effort — don't fail the request if it errors)
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    const referer  = req.headers.get("referer") ?? "";
    const locale   = referer.match(/\/([a-z]{2}(?:-[a-z]{2,4})?)\//i)?.[1] ?? "unknown";

    // Translate message to Korean if it wasn't sent from the Korean page
    let messageKo = "";
    const deeplKey = process.env.DEEPL_API_KEY;
    if (locale !== "ko" && deeplKey && message?.trim()) {
      try {
        const baseUrl = deeplKey.endsWith(":fx")
          ? "https://api-free.deepl.com"
          : "https://api.deepl.com";
        const tlRes  = await fetch(`${baseUrl}/v2/translate`, {
          method:  "POST",
          headers: { Authorization: `DeepL-Auth-Key ${deeplKey}`, "Content-Type": "application/json" },
          body:    JSON.stringify({ text: [message], target_lang: "KO" }),
        });
        const tlData = await tlRes.json() as { translations: { text: string }[] };
        messageKo = tlData.translations?.[0]?.text ?? "";
      } catch {
        // translation failure is non-fatal
      }
    }

    const fields = [
      { name: "Name",     value: name,                               inline: true },
      { name: "Email",    value: email,                              inline: true },
      { name: "Subject",  value: subjectLabels[subject] ?? subject,  inline: true },
      { name: "Language", value: locale,                             inline: true },
      companyName ? { name: "Company",  value: companyName,  inline: true } : null,
      phone       ? { name: "Phone",    value: phone,        inline: true } : null,
      budget      ? { name: "Budget",   value: budget,       inline: true } : null,
      dueDate     ? { name: "Due Date", value: dueDate,      inline: true } : null,
      { name: "Display Rights", value: displayRights ? "✓ Permitted" : "✗ Not permitted", inline: true },
      { name: "Message",    value: message.slice(0, 1024) },
      messageKo ? { name: "Message (KO)", value: messageKo.slice(0, 1024) } : null,
    ].filter(Boolean);

    await fetch(discordWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "New Inquiry — MontBlanc",
          color: 0xffffff,
          fields,
        }],
      }),
    }).catch((err) => console.error("Discord notify error:", err));
  }

  return NextResponse.json({ success: true });
}
