import { cache } from "react";
import type { Metadata } from "next";
import { google } from "googleapis";

import Gallery, { type Work } from "../../_components/Gallery";
import { getTranslations } from "next-intl/server";
import { makeAuth, resolveDescriptions } from "../../lib/google";

const getWorks = cache(async (locale: string): Promise<Work[]> => {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId    = process.env.GOOGLE_SHEETS_ID;
  const r2Url      = process.env.R2_PUBLIC_URL;
  const deeplKey   = process.env.DEEPL_API_KEY;

  if (!email || !privateKey || !sheetId || !r2Url) {
    return [
      { id: 1, title: "Project One",   description: "Placeholder description.", src: "https://placehold.co/1920x1080/111111/eeeeee" },
      { id: 2, title: "Project Two",   description: "",                          src: "https://placehold.co/1920x1080/222222/eeeeee" },
      { id: 3, title: "Project Three", description: "",                          src: "https://placehold.co/1920x1080/333333/eeeeee" },
    ];
  }

  const auth = makeAuth(email, privateKey);
  const sheets = google.sheets({ version: "v4", auth });

  let rows: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Portfolio!A2:E100",
    });
    rows = (res.data.values ?? []) as string[][];
  } catch {
    return [];
  }

  // Portfolio sheet: A=filename, B=KO desc, C=EN, D=JA, E=ZH
  const descriptions = await resolveDescriptions(
    rows, locale,
    1,
    { en: "C", ja: "D", zh: "E" },
    "Portfolio",
    sheets, sheetId, deeplKey
  );

  return rows
    .filter(([filename]) => !!filename?.trim())
    .map((row, index) => {
      const filename = row[0].trim();
      const nameNoExt = filename.replace(/\.[^/.]+$/, "");
      const title = nameNoExt
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        id: index + 1,
        title,
        description: descriptions[index],
        src: `${r2Url}/${encodeURIComponent(filename)}`,
      };
    });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const works = await getWorks(locale);
  const ogImage = works[0]?.src;
  return {
    title: "Portfolio",
    description: "Browse illustrations and character design work by MontBlanc.",
    openGraph: {
      title:       "MontBlanc — Portfolio",
      description: "Browse illustrations and character design work by MontBlanc.",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      title:       "MontBlanc — Portfolio",
      description: "Browse illustrations and character design work by MontBlanc.",
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  const works = await getWorks(locale);
  return <Gallery works={works} noWorksMessage={t("noWorks")} />;
}
