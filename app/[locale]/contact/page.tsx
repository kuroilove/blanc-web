import { getTranslations } from "next-intl/server";

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="max-w-xl mx-auto px-8 py-16">
      <h1 className="text-2xl font-semibold mb-8">{t("title")}</h1>
      <form className="space-y-5">
        <div>
          <label className="block text-sm mb-1">{t("name")}</label>
          <input
            type="text"
            className="w-full border border-white/20 px-3 py-2 text-sm rounded focus:outline-none focus:border-white transition-colors"
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">{t("email")}</label>
          <input
            type="email"
            className="w-full border border-white/20 px-3 py-2 text-sm rounded focus:outline-none focus:border-white transition-colors"
            placeholder={t("emailPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">{t("subject")}</label>
          <select className="w-full border border-white/20 px-3 py-2 text-sm rounded focus:outline-none focus:border-white transition-colors bg-black text-white">
            <option value="">{t("subjectDefault")}</option>
            <option value="commission">{t("subjectCommission")}</option>
            <option value="commercial">{t("subjectCommercial")}</option>
            <option value="other">{t("subjectOther")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">{t("message")}</label>
          <textarea
            rows={5}
            className="w-full border border-white/20 px-3 py-2 text-sm rounded focus:outline-none focus:border-white transition-colors"
            placeholder={t("messagePlaceholder")}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-white/10 text-white py-2 text-sm rounded hover:bg-white/20 transition-colors"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
