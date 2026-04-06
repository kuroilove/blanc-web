import { cache } from "react";
import { getAccessToken, sheetsGet, resolveDescriptions } from "./google";

export type NewsItem = {
  src:  string;
  link: string;
  text: string;
};

// Sheet: News — A=image filename, B=link url, C=ko, D=en, E=ja, F=zh
export const fetchNews = cache(async (locale: string): Promise<NewsItem[]> => {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId    = process.env.GOOGLE_SHEETS_ID;
  const r2Url      = process.env.R2_PUBLIC_URL;
  const deeplKey   = process.env.DEEPL_API_KEY;

  if (!email || !privateKey || !sheetId || !r2Url) return [];

  try {
    const token = await getAccessToken(email, privateKey);
    const rows  = await sheetsGet(token, sheetId, "News!A2:F100");
    if (!rows.length) return [];

    const texts = await resolveDescriptions(
      rows, locale, 2, { en: "D", ja: "E", zh: "F" },
      "News", token, sheetId, deeplKey
    );

    return rows
      .filter((r) => r[0]?.trim())
      .map((row, i) => ({
        src:  `${r2Url}/${encodeURIComponent(row[0].trim())}`,
        link: row[1]?.trim() ?? "",
        text: texts[i] ?? "",
      }));
  } catch {
    return [];
  }
});
