"use client";

import { useState, useEffect } from "react";
import type { NewsItem } from "../lib/news";

export default function NewsStrip({ items }: { items: NewsItem[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [modalItem, setModalItem] = useState<NewsItem | null>(null);

  // Auto-advance
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(id);
  }, [items.length]);

  // ESC closes modal
  useEffect(() => {
    if (!modalItem) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setModalItem(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [modalItem]);

  if (!items.length) return null;

  const active = items[activeIdx];

  return (
    <>
      <div className="space-y-2">
        {/* Single card — fades between items */}
        <button
          onClick={() => setModalItem(active)}
          className="w-full text-left group relative"
        >
          <div className="aspect-square w-full overflow-hidden bg-white/5 relative">
            {items.map((item, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={item.src}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105 ${
                  i === activeIdx ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
          {active.text && (
            <p className="text-xs text-white/50 mt-2 line-clamp-3 leading-snug text-left">
              {active.text}
            </p>
          )}
        </button>

        {/* Dots */}
        {items.length > 1 && (
          <div className="flex gap-1.5 justify-center pt-1">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                aria-label={`News item ${i + 1}`}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i === activeIdx ? "bg-white/50" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail overlay */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setModalItem(null)}
        >
          <div
            className="bg-[#111] border border-white/10 w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={modalItem.src}
              alt=""
              className="w-full max-h-72 object-contain bg-black"
            />
            <div className="p-5 space-y-3">
              {modalItem.text && (
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                  {modalItem.text}
                </p>
              )}
              {modalItem.link && (
                <a
                  href={modalItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <span>→</span>
                  <span className="underline underline-offset-2 break-all">{modalItem.link}</span>
                </a>
              )}
              <button
                onClick={() => setModalItem(null)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
