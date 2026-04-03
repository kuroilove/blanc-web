"use client";

import { useState } from "react";

export type Work = {
  id: number;
  title: string;
  description: string;
  src: string;
};

export default function Gallery({ works, noWorksMessage }: { works: Work[]; noWorksMessage: string }) {
  const [selectedId, setSelectedId] = useState(works[0]?.id);
  const [loadedIds, setLoadedIds] = useState<Set<number>>(new Set());
  const selected = works.find((w) => w.id === selectedId) ?? works[0];
  const currentLoaded = loadedIds.has(selectedId);

  if (!works.length) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-gray-500 text-sm">
        {noWorksMessage}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden group/gallery">

      {/* Grey pulse shown while current image is still loading */}
      {!currentLoaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}

      {/* All images stacked — each loads once and stays in the DOM */}
      {works.map((work) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={work.id}
          src={work.src}
          alt={work.title}
          onLoad={() => setLoadedIds((prev) => new Set(prev).add(work.id))}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
            work.id === selectedId && loadedIds.has(work.id) ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Title + description — bottom left, appears on hover */}
      <div className="absolute bottom-8 left-8 max-w-sm opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300">
        <p className="text-white text-sm tracking-widest uppercase mb-1">{selected.title}</p>
        {selected.description && (
          <p className="text-white/70 text-xs leading-relaxed whitespace-pre-line">{selected.description}</p>
        )}
      </div>

      {/* Right sidebar — appears on hover */}
      <div className="absolute right-0 top-0 h-full flex flex-col justify-center pr-8 pl-16 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 bg-gradient-to-l from-black/50 to-transparent">
        <ul className="space-y-4">
          {works.map((work) => (
            <li key={work.id} className="text-right">
              <button
                onClick={() => setSelectedId(work.id)}
                className={`text-sm transition-colors ${
                  work.id === selectedId
                    ? "text-white font-semibold"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {work.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
