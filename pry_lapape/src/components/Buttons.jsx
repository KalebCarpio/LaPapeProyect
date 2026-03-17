"use client";
import { cn } from "@/lib/utils";

const theme = { primary: "#FFD54F", secondary: "#4A90E2", inkStrong: "#1C1C1C" };

/**
 * Botón primario — brillo suave + elevación + glow en hover.
 * Mantiene tu color #FFD54F y texto oscuro.
 */
export function PrimaryButton({ className, children, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "relative group overflow-hidden inline-flex items-center justify-center gap-2",
        "h-12 px-6 rounded-[30px] font-bold cursor-pointer",            // 👈 aquí
        "shadow-[0_8px_0_#d4b032] hover:shadow-[0_14px_28px_rgba(0,0,0,.22)]",
        "transition-all duration-300 ease-out hover:-translate-y-[1px] active:translate-y-[0px]",
        "focus:outline-none focus:ring-4 focus:ring-[#FFD54F]/45",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      style={{ background: "#FFD54F", color: "#1C1C1C" }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[30px] opacity-0 group-hover:opacity-40 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.55),transparent_60%)]" />
      <span className="pointer-events-none absolute -left-1/2 top-0 h-full w-[55%] -skew-x-12 bg-white/30 blur-md opacity-0 group-hover:opacity-60 transition-all duration-500 group-hover:translate-x-[220%]" />
      {children}
    </button>
  );
}

export function SecondaryButton({ className, children, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "relative inline-flex items-center justify-center gap-2",
        "h-12 px-6 rounded-[30px] font-bold bg-white border-2 cursor-pointer", // 👈 aquí
        "transition-all duration-300 ease-out hover:-translate-y-[1px] active:translate-y-[0px]",
        "hover:bg-[#eaf3ff] hover:shadow-[0_12px_28px_rgba(74,144,226,.25)]",
        "focus:outline-none focus:ring-4 focus:ring-[#4A90E2]/35",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      style={{ borderColor: "#4A90E2", color: "#4A90E2" }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[30px] opacity-0 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_center,rgba(74,144,226,.25),transparent_60%)]" />
      {children}
    </button>
  );
}

