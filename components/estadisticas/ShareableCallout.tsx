"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { SummaryCallout } from "@/lib/analytics";

export default function ShareableCallout({ callout }: { callout: SummaryCallout }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const share = async () => {
    if (!ref.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: "#0a0e17",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `super-quinielas-${callout.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-w-[150px] flex-shrink-0 snap-start flex-col rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white">
      <div ref={ref} className="rounded-lg bg-gradient-to-br from-stadium-dark to-stadium-navy p-3 text-white">
        <p className="font-display text-lg text-pitch">SUPER QUINIELAS</p>
        <p className="mt-2 text-3xl">{callout.emoji}</p>
        <p className="font-display text-3xl text-gold">{callout.value}</p>
        <p className="mt-1 text-xs text-slate-400">{callout.label}</p>
        {callout.detail && (
          <p className="mt-1 truncate text-[10px] text-slate-500">{callout.detail}</p>
        )}
      </div>
      <button
        onClick={share}
        disabled={loading}
        className="mt-2 rounded-lg bg-pitch/20 px-2 py-1.5 text-xs font-semibold text-pitch hover:bg-pitch/30"
      >
        {loading ? "..." : "Compartir"}
      </button>
    </div>
  );
}
