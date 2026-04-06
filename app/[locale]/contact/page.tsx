import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ContactForm from "../../_components/ContactForm";
import { fetchNews } from "../../lib/news";
import NewsStrip from "../../_components/NewsStrip";


export const metadata: Metadata = {
  title:       "Contact",
  description: "Get in touch with MontBlanc for commission inquiries and commercial projects.",
  openGraph: {
    title:       "MontBlanc — Contact",
    description: "Get in touch with MontBlanc for commission inquiries and commercial projects.",
  },
  twitter: {
    title:       "MontBlanc — Contact",
    description: "Get in touch with MontBlanc for commission inquiries and commercial projects.",
  },
};

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, news] = await Promise.all([
    getTranslations({ locale, namespace: "contact" }),
    fetchNews(locale),
  ]);

  const translations = {
    name:               t("name"),
    namePlaceholder:    t("namePlaceholder"),
    companyName:        t("companyName"),
    companyNamePlaceholder: t("companyNamePlaceholder"),
    email:              t("email"),
    emailPlaceholder:   t("emailPlaceholder"),
    phone:              t("phone"),
    phonePlaceholder:   t("phonePlaceholder"),
    phoneHint:          t("phoneHint"),
    subject:            t("subject"),
    subjectDefault:     t("subjectDefault"),
    subjectCommission:  t("subjectCommission"),
    subjectCommercial:  t("subjectCommercial"),
    subjectOther:       t("subjectOther"),
    budget:             t("budget"),
    budgetPlaceholder:  t("budgetPlaceholder"),
    dueDate:            t("dueDate"),
    displayRights:      t("displayRights"),
    displayRightsLabel: t("displayRightsLabel"),
    message:            t("message"),
    messagePlaceholder: t("messagePlaceholder"),
    send:               t("send"),
    optional:           t("optional"),
    sending:            t("sending"),
    successMessage:     t("successMessage"),
    errorMessage:       t("errorMessage"),
  };

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-16">
      <h1 className="text-2xl font-semibold mb-8">{t("title")}</h1>
      {news.length > 0 && <div className="mb-8"><NewsStrip items={news} /></div>}
      <ContactForm t={translations} />
    </div>
  );
}
