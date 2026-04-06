"use client";

import { useState, useEffect, useRef } from "react";
import type { NewsItem } from "../lib/news";

export default function NewsStrip({ items }: { items: NewsItem[] }) {
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [modalItem,  setModalItem]  = useState<NewsItem | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const pausedRef      = useRef(false);

  // Auto-advance
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setActiveIdx((prev) => {
        const next = (prev + 1) % items.length;
        const container = containerRef.current;
        if (container) {
          const card = container.children[next] as HTMLElement | undefined;
          card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        }
        return next;
      });
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

  return (
    <>
      <div className="space-y-2">
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onTouchStart={() => { pausedRef.current = true; }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setModalItem(item)}
              className="snap-start flex-shrink-0 w-28 md:w-36 text-left group"
            >
              <div className={`aspect-square overflow-hidden transition-opacity duration-500 ${
                i === activeIdx ? "opacity-100" : "opacity-40"
              }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {item.text && (
                <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-snug">{item.text}</p>
              )}
            </button>
          ))}
        </div>

        {/* Dots */}
        {items.length > 1 && (
          <div className="flex gap-1.5 justify-center">
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
              className="w-full max-h-64 object-contain bg-black"
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
