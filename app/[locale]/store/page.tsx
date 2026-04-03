import { google } from "googleapis";
import { getTranslations } from "next-intl/server";
import { makeAuth, resolveDescriptions } from "../../lib/google";

type StoreItem = {
  filename: string;
  title: string;
  description: string;
  link: string;
  src: string;
};

async function getStoreItems(locale: string): Promise<StoreItem[]> {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId    = process.env.GOOGLE_SHEETS_ID;
  const r2Url      = process.env.R2_PUBLIC_URL;
  const deeplKey   = process.env.DEEPL_API_KEY;

  if (!email || !privateKey || !sheetId || !r2Url) return [];

  const auth = makeAuth(email, privateKey);
  const sheets = google.sheets({ version: "v4", auth });

  let rows: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Store!A2:F100",
    });
    rows = (res.data.values ?? []) as string[][];
  } catch {
    return [];
  }

  // Store sheet: A=filename, B=link, C=KO desc, D=EN, E=JA, F=ZH
  const descriptions = await resolveDescriptions(
    rows, locale,
    2,
    { en: "D", ja: "E", zh: "F" },
    "Store",
    sheets, sheetId, deeplKey
  );

  return rows
    .filter(([filename]) => !!filename?.trim())
    .map((row, index) => {
      const filename  = row[0].trim();
      const link      = row[1]?.trim() ?? "";
      const nameNoExt = filename.replace(/\.[^/.]+$/, "");
      const title     = nameNoExt
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        filename,
        title,
        description: descriptions[index],
        link,
        src: `${r2Url}/${encodeURIComponent(filename)}`,
      };
    });
}

const storeLinks = [
  { name: "Etsy",      description: "Prints, stickers, and original works",  url: "https://etsy.com/shop/placeholder" },
  { name: "Redbubble", description: "Apparel, accessories, and home goods",   url: "https://redbubble.com/people/placeholder" },
  { name: "Booth",     description: "Doujinshi and limited edition items",    url: "https://placeholder.booth.pm" },
];

export default async function Store({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "store" });
  const items = await getStoreItems(locale);

  return (
    <div className="max-w-5xl mx-auto px-8 py-16 space-y-16">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {items.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
            {t("items")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <a
                key={item.filename}
                href={item.link || "#"}
                target={item.link ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full aspect-square object-contain transition-opacity group-hover:opacity-75"
                />
                <div className="mt-2">
                  <p className="text-sm group-hover:underline">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
          {t("whereToFind")}
        </h2>
        <div className="divide-y divide-white/10">
          {storeLinks.map((store) => (
            <a
              key={store.name}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center py-4 group"
            >
              <div>
                <p className="text-sm font-medium group-hover:underline">{store.name}</p>
                <p className="text-xs text-white/50 mt-0.5">{store.description}</p>
              </div>
              <span className="text-white/20 group-hover:text-white transition-colors text-lg">→</span>
            </a>
          ))}
        </div>
      </div>

      <div className="text-xs text-white/50 space-y-1">
        <p>{t("footer1")}</p>
        <p>{t("footer2")}</p>
      </div>
    </div>
  );
}
