import Link from "next/link";

export default function Breadcrumbs({ items = [] }) {
  // items ejemplo:
  // [{ label: "Inicio", href: "/" }, { label: "Catálogo" }]
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[#4A90E2] hover:underline font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[#1C1C1C] font-semibold" : "text-[#666666]"}>
                  {item.label}
                </span>
              )}

              {!isLast && <span className="text-[#999999]">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
