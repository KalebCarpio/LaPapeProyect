"use client";

import { Archive, AlertTriangle, BadgeCheck, PackageX } from "lucide-react";
import { CommercialSummaryGrid } from "@/components/commercial/CommercialUI";

const cards = [
  {
    key: "total",
    title: "Registros totales",
    description: "Productos cargados en inventario",
    icon: Archive,
    bg: "bg-[#FFF8DB]",
    text: "text-[#8A5C00]",
  },
  {
    key: "active",
    title: "Activos",
    description: "Disponibles para operacion comercial",
    icon: BadgeCheck,
    bg: "bg-[#EAFBF1]",
    text: "text-[#047857]",
  },
  {
    key: "inactive",
    title: "Inactivos",
    description: "Pausados o fuera del flujo operativo",
    icon: PackageX,
    bg: "bg-[#EEF2FF]",
    text: "text-[#4338CA]",
  },
  {
    key: "lowStock",
    title: "Bajo stock",
    description: "Revisar reabasto o ajuste de minimos",
    icon: AlertTriangle,
    bg: "bg-[#FFF1F2]",
    text: "text-[#BE123C]",
  },
];

export default function ProductSummaryCards({ summary }) {
  return (
    <CommercialSummaryGrid
      items={cards.map((card) => ({
        key: card.key,
        label: card.title,
        value: summary[card.key],
        description: card.description,
        icon: card.icon,
        bgClassName: card.bg,
        iconClassName: card.text,
      }))}
    />
  );
}
