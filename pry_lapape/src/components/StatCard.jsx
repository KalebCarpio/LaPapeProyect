export default function StatCard({ title, desc, icon, href }) {
  return (
    <a
      href={href}
      className="group block rounded-2xl bg-white border hover:border-[#4A90E2] transition-colors p-4"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,.04)" }}
    >
      <div className="flex items-start gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-[#4A90E2]/10 text-[#4A90E2]">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-[#1C1C1C]">{title}</h4>
          <p className="text-xs text-[#555]">{desc}</p>
        </div>
      </div>
      <div className="pt-3 text-xs font-semibold text-[#4A90E2] opacity-0 group-hover:opacity-100 transition-opacity">
        Ver más →
      </div>
    </a>
  );
}
