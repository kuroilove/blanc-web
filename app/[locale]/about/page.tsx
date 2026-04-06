import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getAccessToken, sheetsGet, resolveDescriptions } from "../../lib/google";
import { fetchNews } from "../../lib/news";
import AboutCarousel from "../../_components/AboutCarousel";
import NewsStrip from "../../_components/NewsStrip";

// ── icon labels for social platforms ─────────────────────────────────────────
const PLATFORM_LABEL: Record<string, string> = {
  twitter:    "Twitter / X",
  x:          "Twitter / X",
  instagram:  "Instagram",
  pinterest:  "Pinterest",
  youtube:    "YouTube",
  tumblr:     "Tumblr",
  pixiv:      "Pixiv",
  artstation: "ArtStation",
  deviantart: "DeviantArt",
  bluesky:    "Bluesky",
  tiktok:     "TikTok",
  linktree:   "Linktree",
};

type SocialLink  = { platform: string; url: string };
type TimelineEntry = { year: string; description: string };

// ── data fetching ─────────────────────────────────────────────────────────────
const fetchAboutData = cache(async (locale: string) => {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId    = process.env.GOOGLE_SHEETS_ID;
  const r2Url      = process.env.R2_PUBLIC_URL;
  const deeplKey   = process.env.DEEPL_API_KEY;

  if (!email || !privateKey || !sheetId) {
    return { images: [], bio: "", socials: [], timeline: [] };
  }

  const token = await getAccessToken(email, privateKey);

  // ── Portfolio images (reuse existing sheet) ──────────────────────────────
  let images: string[] = [];
  if (r2Url) {
    try {
      const rows = await sheetsGet(token, sheetId, "Portfolio!A2:A100");
      images = rows.map((r) => r[0]?.trim()).filter(Boolean)
        .map((filename) => `${r2Url}/${encodeURIComponent(filename)}`);
    } catch (e) { console.error("Google Sheets error (about):", e); }
  }

  // ── About sheet: A=field, B=ko, C=en, D=ja, E=zh ────────────────────────
  let bioText = "";
  try {
    const rows = await sheetsGet(token, sheetId, "About!A2:E50");
    const bioRow = rows.find((r) => r[0]?.toLowerCase() === "bio");
    if (bioRow) {
      const resolved = await resolveDescriptions(
        [bioRow], locale, 1, { en: "C", ja: "D", zh: "E" },
        "About", token, sheetId, deeplKey
      );
      bioText = resolved[0] ?? "";
    }
  } catch (e) { console.error("Google Sheets error (sheet):", e); }

  // ── Social sheet: A=platform, B=url ─────────────────────────────────────
  let socials: SocialLink[] = [];
  try {
    const rows = await sheetsGet(token, sheetId, "Social!A2:B20");
    socials = rows.filter((r) => r[0] && r[1])
      .map((r) => ({ platform: r[0].trim(), url: r[1].trim() }));
  } catch (e) { console.error("Google Sheets error (sheet):", e); }

  // ── Timeline sheet: A=year, B=ko, C=en, D=ja, E=zh ──────────────────────
  let timeline: TimelineEntry[] = [];
  try {
    const rows = (await sheetsGet(token, sheetId, "Timeline!A2:E100")).filter((r) => r[0]);
    const descriptions = await resolveDescriptions(
      rows, locale, 1, { en: "C", ja: "D", zh: "E" },
      "Timeline", token, sheetId, deeplKey
    );
    timeline = rows.map((row, i) => ({ year: row[0] ?? "", description: descriptions[i] ?? "" }));
  } catch (e) { console.error("Google Sheets error (sheet):", e); }

  return { images, bio: bioText, socials, timeline };
});

// ── metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { images, bio } = await fetchAboutData(locale);
  const ogImage    = images[0];
  const description = bio || "Freelance illustrator specialising in character design and emotive illustration.";
  return {
    title: "About",
    description,
    openGraph: {
      title:       "MontBlanc — About",
      description,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      title:       "MontBlanc — About",
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

// ── page ──────────────────────────────────────────────────────────────────────
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const [{ images, bio, socials, timeline }, news] = await Promise.all([
    fetchAboutData(locale),
    fetchNews(locale),
  ]);

  return (
    <div>
      {/* ── Hero: title + carousel ── */}
      <div className="py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.25em] uppercase mb-8">
          MontBlanc
        </h1>
        <AboutCarousel images={images} />
      </div>

      {/* ── News strip ── */}
      {news.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 pb-4">
          <NewsStrip items={news} />
        </div>
      )}

      {/* ── Content: socials left | bio + timeline right ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-14 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-12">

        {/* Left — social links */}
        <aside className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-4">
            {t("socials")}
          </p>
          {socials.length === 0 ? (
            <p className="text-white/20 text-xs italic">
              (Add rows to the Social sheet)
            </p>
          ) : (
            socials.map(({ platform, url }) => {
              const label = PLATFORM_LABEL[platform.toLowerCase()]
                ?? (platform.charAt(0).toUpperCase() + platform.slice(1));
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
                  {label}
                </a>
              );
            })
          )}
        </aside>

        {/* Right — bio + timeline */}
        <div className="space-y-8">

          {/* Bio */}
          <section>
            <p className="text-xs uppercase tracking-widest text-white/30 mb-4">
              {t("title")}
            </p>
            {bio ? (
              <p className="text-white/70 leading-relaxed whitespace-pre-line text-sm">
                {bio}
              </p>
            ) : (
              <p className="text-white/20 text-xs italic">
                (Add a row with field=&ldquo;bio&rdquo; in the About sheet)
              </p>
            )}
          </section>

          {/* Timeline */}
          {timeline.length > 0 && (
            <section>
              <p className="text-xs uppercase tracking-widest text-white/30 mb-4">
                {t("timeline")}
              </p>
              <div className="overflow-y-auto max-h-64 pr-2 space-y-4 border-l border-white/10 pl-5
                              scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {[...timeline].reverse().map((entry, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-white/30 font-mono text-xs">{entry.year}</span>
                    <p className="text-white/65 leading-relaxed mt-0.5">{entry.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
