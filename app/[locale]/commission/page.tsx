import { google } from "googleapis";
import { getTranslations } from "next-intl/server";
import { makeAuth } from "../../lib/google";

const STATUS_MAP: Record<string, string> = {
  open:       "O",
  closed:     "✕",
  negotiable: "△",
};

type ScheduleTable = {
  year: string;
  rows: { month: string; status: string }[];
};

async function getSchedules(): Promise<ScheduleTable[]> {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId    = process.env.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !sheetId) {
    return [{
      year: "2026",
      rows: [
        { month: "Jan", status: "closed" }, { month: "Feb", status: "closed" },
        { month: "Mar", status: "closed" }, { month: "Apr", status: "open" },
        { month: "May", status: "open" },   { month: "Jun", status: "negotiable" },
        { month: "Jul", status: "negotiable" }, { month: "Aug", status: "closed" },
        { month: "Sep", status: "closed" }, { month: "Oct", status: "open" },
        { month: "Nov", status: "open" },   { month: "Dec", status: "negotiable" },
      ],
    }];
  }

  const auth = makeAuth(email, privateKey);
  const sheets = google.sheets({ version: "v4", auth });

  let rows: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Schedule!A2:F100",
    });
    rows = (res.data.values ?? []) as string[][];
  } catch {
    return [];
  }

  // Read year labels from first row that has them
  const year1 = rows.find(r => r[0]?.trim())?.[0]?.trim() ?? "";
  const year2 = rows.find(r => r[3]?.trim())?.[3]?.trim() ?? "";

  const table1 = rows
    .filter(r => r[1]?.trim())
    .map(r => ({ month: r[1].trim(), status: (r[2] ?? "").toLowerCase().trim() }));

  const table2 = rows
    .filter(r => r[4]?.trim())
    .map(r => ({ month: r[4].trim(), status: (r[5] ?? "").toLowerCase().trim() }));

  // Hide second table if all statuses are empty
  const table2HasData = table2.some(r => r.status !== "");

  const result: ScheduleTable[] = [];
  if (table1.length) result.push({ year: year1, rows: table1 });
  if (table2.length && table2HasData) result.push({ year: year2, rows: table2 });

  return result;
}

function ScheduleGrid({ table }: { table: ScheduleTable }) {
  return (
    <div className="space-y-2">
      {table.year && (
        <p className="text-xs text-white/40 uppercase tracking-widest">{table.year}</p>
      )}
      <div className="grid grid-cols-6 border border-white/10">
        {table.rows.map((item, i) => (
          <div
            key={`${item.month}-${i}`}
            className={`flex flex-col items-center py-4 gap-2 border-white/10
              ${i % 6 !== 5 ? "border-r" : ""}
              ${i < 6 ? "border-b" : ""}
            `}
          >
            <span className="text-xs text-white/50">{item.month}</span>
            <span className="text-lg font-light">{STATUS_MAP[item.status] ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Commission({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "commission" });
  const schedules = await getSchedules();

  return (
    <div className="max-w-2xl mx-auto px-8 py-16 space-y-12">

      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {/* Schedule tables */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
          {t("schedule")}
        </h2>
        {schedules.map((table) => (
          <ScheduleGrid key={table.year} table={table} />
        ))}
        <div className="flex gap-6 text-xs text-white/50">
          <span>O — {t("legend.available")}</span>
          <span>△ — {t("legend.contact")}</span>
          <span>✕ — {t("legend.closed")}</span>
        </div>
      </div>

      {/* Offering */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
          {t("offering.title")}
        </h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-white/10">
            <tr>
              <td className="py-2 text-white/80">{t("offering.illustration")}</td>
              <td className="py-2 text-right text-white/50">{t("offering.fromPrice")}</td>
            </tr>
            <tr>
              <td className="py-2 text-white/80">{t("offering.character")}</td>
              <td className="py-2 text-right text-white/50">{t("offering.fromPrice")}</td>
            </tr>
            <tr>
              <td className="py-2 text-white/80">{t("offering.commercial")}</td>
              <td className="py-2 text-right text-white/50">{t("offering.inquire")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Process */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
          {t("process.title")}
        </h2>
        <ol className="space-y-2 text-sm text-white/80">
          {["step1", "step2", "step3", "step4"].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="text-white/20 select-none">0{i + 1}</span>
              {t(`process.${step}`)}
            </li>
          ))}
        </ol>
      </div>

    </div>
  );
}
