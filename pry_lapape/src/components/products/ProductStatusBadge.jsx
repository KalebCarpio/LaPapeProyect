"use client";

import { cn } from "@/lib/utils";

export default function ProductStatusBadge({ active }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
