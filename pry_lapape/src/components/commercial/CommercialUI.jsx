"use client";

import { X } from "lucide-react";

export function CommercialHero({
  eyebrow = "Gestion comercial",
  title,
  description,
  actions,
}) {
  return (
    <div className="rounded-[32px] border border-[#FFE9A8] bg-gradient-to-r from-[#FFF8DB] via-[#FFFDF5] to-white p-6 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#1F2933]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#4B5563]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

export function CommercialSummaryGrid({ items }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.key}
            className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                  {item.label}
                </p>
                <div className="mt-3 text-3xl font-extrabold text-[#1F2933]">{item.value}</div>
                <div className="mt-2 text-sm text-[#4B5563]">{item.description}</div>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${item.bgClassName}`}>
                <Icon className={`h-6 w-6 ${item.iconClassName}`} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function CommercialPanel({ title, subtitle, actions, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      {(title || subtitle || actions) && (
        <div className="border-b border-[#F1F5F9] px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              {title ? <h3 className="text-xl font-bold text-[#1F2933]">{title}</h3> : null}
              {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

export function CommercialFilterCard({ title = "Busqueda y filtros", subtitle, actions, children }) {
  return (
    <section className="rounded-3xl border border-[#FFE9A8] bg-white/95 p-5 shadow-[0_18px_40px_rgba(245,158,11,0.12)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">{title}</p>
            {subtitle ? <p className="mt-1 text-sm text-[#4B5563]">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function CommercialEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFF7E6]">
        <Icon className="h-8 w-8 text-[#C47A00]" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-[#1F2933]">{title}</h3>
      <p className="mt-2 text-sm text-[#6B7280]">{description}</p>
    </div>
  );
}

export function CommercialModalShell({ eyebrow = "Gestion comercial", title, subtitle, maxWidthClassName = "max-w-4xl", onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-[32px] border border-white/60 bg-[#FFFCF4] shadow-[0_30px_80px_rgba(15,23,42,0.28)] ${maxWidthClassName}`}>
        <div className="flex items-start justify-between gap-4 border-b border-[#F6E7B8] px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">{eyebrow}</p>
            <h2 className="mt-2 text-2xl font-bold text-[#1F2933]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#E5E7EB] bg-white text-[#4B5563] transition hover:border-[#F59E0B] hover:text-[#C47A00]"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
