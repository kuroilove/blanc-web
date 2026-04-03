import { google } from "googleapis";

export const LOCALE_COL_OFFSET = 2; // KO=0, EN=1, JA=2, ZH=3 relative to description start col

export const DEEPL_LANG: Record<string, string> = {
  en: "EN-US",
  ja: "JA",
  zh: "ZH-HANS",
};

export function makeAuth(email: string, privateKey: string) {
  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function translateBatch(
  texts: string[],
  targetLang: string,
  apiKey: string
): Promise<string[]> {
  if (!texts.length) return [];
  const baseUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";

  const res = await fetch(`${baseUrl}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      source_lang: "KO",
      target_lang: targetLang,
    }),
  });

  const data = await res.json();
  return (data.translations as { text: string }[]).map((t) => t.text);
}

// Resolves description for current locale, calls DeepL + writes back if needed
// descStartCol: 0-indexed column where KO description sits
// colLetters: e.g. { en: "D", ja: "E", zh: "F" }
export async function resolveDescriptions(
  rows: string[][],
  locale: string,
  descStartCol: number,
  colLetters: Record<string, string>,
  sheetTab: string,
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  deeplKey: string | undefined
): Promise<string[]> {
  const isKo = locale === "ko";
  const localeColOffsets: Record<string, number> = { ko: 0, en: 1, ja: 2, zh: 3 };
  const colOffset = localeColOffsets[locale] ?? 1;
  const targetColIndex = descStartCol + colOffset;

  const needsTranslation: { rowIndex: number; koText: string }[] = [];

  if (!isKo && deeplKey && DEEPL_LANG[locale]) {
    rows.forEach((row, i) => {
      const koText = row[descStartCol]?.trim();
      const targetText = row[targetColIndex]?.trim();
      if (koText && !targetText) {
        needsTranslation.push({ rowIndex: i, koText });
      }
    });
  }

  const translationMap: Record<number, string> = {};

  if (needsTranslation.length && deeplKey && DEEPL_LANG[locale] && colLetters[locale]) {
    const translations = await translateBatch(
      needsTranslation.map((n) => n.koText),
      DEEPL_LANG[locale],
      deeplKey
    );

    needsTranslation.forEach(({ rowIndex }, i) => {
      translationMap[rowIndex] = translations[i] ?? "";
    });

    // Write back to sheet
    const writeData = needsTranslation.map(({ rowIndex }, i) => ({
      range: `${sheetTab}!${colLetters[locale]}${rowIndex + 2}`,
      values: [[translations[i] ?? ""]],
    }));

    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { valueInputOption: "RAW", data: writeData },
      });
    } catch (e) {
      console.error("Failed to write translations back to sheet:", e);
    }
  }

  return rows.map((row, i) =>
    row[targetColIndex]?.trim() || translationMap[i] || row[descStartCol]?.trim() || ""
  );
}
