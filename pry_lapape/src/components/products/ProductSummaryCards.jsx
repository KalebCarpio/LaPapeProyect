"use client";

import { Archive, AlertTriangle, BadgeCheck, PackageX } from "lucide-react";

const cards = [
  {
    key: "total",
    title: "Productos totales",
    description: "Inventario registrado en el panel",
    icon: Archive,
    bg: "bg-[#FFF8DB]",
    text: "text-[#8A5C00]",
  },
  {
    key: "active",
    title: "Activos",
    description: "Productos visibles para operación",
    icon: BadgeCheck,
    bg: "bg-[#EAFBF1]",
    text: "text-[#047857]",
  },
  {
    key: "inactive",
    title: "Inactivos",
    description: "Productos pausados o fuera de catálogo",
    icon: PackageX,
    bg: "bg-[#EEF2FF]",
    text: "text-[#4338CA]",
  },
  {
    key: "lowStock",
    title: "Bajo stock",
    description: "Revisar reabasto o ajuste de mínimos",
    icon: AlertTriangle,
    bg: "bg-[#FFF1F2]",
    text: "text-[#BE123C]",
  },
];

export default function ProductSummaryCards({ summary }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.key}
            className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                  {card.title}
                </p>
                <p className="mt-3 text-3xl font-extrabold text-[#1F2933]">
                  {summary[card.key]}
                </p>
                <p className="mt-2 text-sm text-[#4B5563]">{card.description}</p>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${card.bg}`}>
                <Icon className={`h-6 w-6 ${card.text}`} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
