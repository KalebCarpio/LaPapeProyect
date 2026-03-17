export function QuickAction({ label, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm font-bold transition-all"
      style={{ background: "#fff", border: "2px solid #4A90E2", color: "#4A90E2" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 16px rgba(74,144,226,.22)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {icon}
      {label}
    </button>
  );
}
