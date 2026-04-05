import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

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

  try {
    await resend.emails.send({
      from: "MontBlanc Contact <onboarding@resend.dev>",
      to: "wchanhe@gmail.com",
      replyTo: email,
      subject: [
        `[${subjectLabels[subject] ?? subject}]`,
        name,
        companyName ? `/ ${companyName}` : null,
        dueDate ? `— Due: ${dueDate}` : null,
      ].filter(Boolean).join(" "),
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
