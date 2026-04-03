"use client";

import { usePathname, useRouter } from "next/navigation";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "ko", label: "KO" },
  { code: "ja", label: "JA" },
  { code: "zh", label: "ZH" },
];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split("/")[1] || "en";

  function switchLocale(next: string) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex gap-3 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={`transition-colors ${
            currentLocale === l.code ? "text-white font-semibold" : "text-white/40 hover:text-white"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
