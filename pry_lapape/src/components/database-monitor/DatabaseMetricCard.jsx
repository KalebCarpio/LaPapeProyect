"use client";

export default function DatabaseMetricCard({
  label,
  value,
  caption,
  tone = "neutral",
  highlight = false,
}) {
  const tones = {
    neutral: "border-[#E5E7EB] bg-white/95",
    amber: "border-[#FFE9A8] bg-[#FFF9E6]",
    blue: "border-[#D7E7FF] bg-[#F6FAFF]",
    emerald: "border-[#CFF5DE] bg-[#F1FDF6]",
  };

  return (
    <article
      className={`rounded-3xl border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition ${tones[tone] || tones.neutral} ${
        highlight ? "ring-1 ring-[#FFD54F]/60" : ""
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-extrabold text-[#1F2933] break-words">{value}</p>
      {caption ? <p className="mt-2 text-sm leading-6 text-[#4B5563]">{caption}</p> : null}
    </article>
  );
}
