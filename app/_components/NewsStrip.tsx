"use client";

import { useState, useEffect, useRef } from "react";
import type { NewsItem } from "../lib/news";

const CARD_H  = 150; // px — card height (square-ish)
const GAP     = 6;   // px — gap between cards
const STEP    = CARD_H + GAP;
const VISIBLE = 3.5; // how many cards show at once

export default function NewsStrip({ items }: { items: NewsItem[] }) {
  const [offset,       setOffset]       = useState(0);
  const [animated,     setAnimated]     = useState(true);
  const [modalItem,    setModalItem]    = useState<NewsItem | null>(null);
  const pausedRef = useRef(false);

  // Duplicate items so the loop is seamless
  const looped = items.length >= 2 ? [...items, ...items] : items;

  // Auto-scroll down one card every 2.5s
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setOffset((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(id);
  }, [items.length]);

  // When we reach the end of the first copy, jump back silently
  useEffect(() => {
    if (offset >= items.length) {
      const t = setTimeout(() => {
        setAnimated(false);
        setOffset(0);
        setTimeout(() => setAnimated(true), 50);
      }, 650);
      return () => clearTimeout(t);
    }
  }, [offset, items.length]);

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
      {/* Ticker container */}
      <div
        style={{ height: `${VISIBLE * STEP}px` }}
        className="overflow-hidden"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onTouchStart={() => { pausedRef.current = true; }}
        onTouchEnd={() => { pausedRef.current = false; }}
      >
        <div
          style={{
            transform:  `translateY(-${offset * STEP}px)`,
            transition: animated ? "transform 0.6s ease" : "none",
          }}
        >
          {looped.map((item, i) => (
            <button
              key={i}
              onClick={() => setModalItem(item)}
              style={{ height: CARD_H, marginBottom: GAP }}
              className="w-full block text-left group overflow-hidden relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* text overlay on hover */}
              {item.text && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent
                                px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-xs text-white/90 line-clamp-2 leading-snug">{item.text}</p>
                </div>
              )}
            </button>
          ))}
        </div>
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
