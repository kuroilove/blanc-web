import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAccessToken, sheetsGet, resolveDescriptions } from "../../lib/google";
import { fetchNews } from "../../lib/news";
import NewsStrip from "../../_components/NewsStrip";

export const metadata: Metadata = {
  title:       "Store",
  description: "Prints, stickers, and original works by MontBlanc — available on Etsy, Redbubble, and Booth.",
  openGraph: {
    title:       "MontBlanc — Store",
    description: "Prints, stickers, and original works by MontBlanc.",
  },
  twitter: {
    title:       "MontBlanc — Store",
    description: "Prints, stickers, and original works by MontBlanc.",
  },
};

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

  const token = await getAccessToken(email, privateKey);

  let rows: string[][] = [];
  try {
    rows = await sheetsGet(token, sheetId, "Store!A2:F100");
  } catch {
    return [];
  }

  const descriptions = await resolveDescriptions(
    rows, locale, 2, { en: "D", ja: "E", zh: "F" },
    "Store", token, sheetId, deeplKey
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

type StoreLink = { name: string; description: string; url: string };

async function getStoreLinks(locale: string): Promise<StoreLink[]> {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId    = process.env.GOOGLE_SHEETS_ID;
  const deeplKey   = process.env.DEEPL_API_KEY;

  if (!email || !privateKey || !sheetId) return [];

  const token = await getAccessToken(email, privateKey);

  let rows: string[][] = [];
  try {
    rows = await sheetsGet(token, sheetId, "StoreLinks!A2:F50");
  } catch {
    return [];
  }

  const descriptions = await resolveDescriptions(
    rows, locale, 2, { en: "D", ja: "E", zh: "F" },
    "StoreLinks", token, sheetId, deeplKey
  );

  return rows
    .filter((r) => r[0]?.trim() && r[1]?.trim())
    .map((row, i) => ({
      name:        row[0].trim(),
      url:         row[1].trim(),
      description: descriptions[i] ?? "",
    }));
}

export default async function Store({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "store" });
  const [items, storeLinks, news] = await Promise.all([
    getStoreItems(locale),
    getStoreLinks(locale),
    fetchNews(locale),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px] gap-12 items-start">
      <div className="space-y-16">
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

      {storeLinks.length > 0 && (
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
      )}

      <div className="text-xs text-white/50 space-y-1">
        <p>{t("footer1")}</p>
        <p>{t("footer2")}</p>
      </div>
      </div>

      {news.length > 0 && (
        <aside className="lg:sticky lg:top-8">
          <NewsStrip items={news} />
        </aside>
      )}
      </div>
    </div>
  );
}
