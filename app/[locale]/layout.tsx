import type { Metadata } from "next";

import { Geist } from "next/font/google";
import "../globals.css";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "../_components/LanguageSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default:  "MontBlanc",
    template: "%s — MontBlanc",
  },
  description: "Freelance illustrator specialising in character design and emotive illustration.",
  openGraph: {
    siteName: "MontBlanc",
    type:     "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <nav className="h-14 flex justify-between items-center px-8 border-b border-white/10">
          <Link href={`/${locale}`} className="font-semibold tracking-widest text-sm uppercase">
            MontBlanc
          </Link>
          <div className="flex items-center gap-8">
            <div className="flex gap-8 text-sm">
              <Link href={`/${locale}/about`} className="hover:text-white/50 transition-colors">{t("about")}</Link>
              <Link href={`/${locale}/portfolio`} className="hover:text-white/50 transition-colors">{t("portfolio")}</Link>
              <Link href={`/${locale}/commission`} className="hover:text-white/50 transition-colors">{t("commission")}</Link>
              <Link href={`/${locale}/store`} className="hover:text-white/50 transition-colors">{t("store")}</Link>
              <Link href={`/${locale}/contact`} className="hover:text-white/50 transition-colors">{t("contact")}</Link>
            </div>
            <LanguageSwitcher />
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="text-center text-xs text-white/40 py-8 border-t border-white/10">
          {tf("copyright")}
        </footer>
      </body>
    </html>
  );
}
