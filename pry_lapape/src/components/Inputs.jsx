"use client";

export default function Input({
  label,
  type = "text",
  placeholder,
  className = "",
  ...props
}) {
  return (
    <label className="flex flex-col gap-2 w-full">
      <span className="text-sm text-[#333]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className={[
          "h-12 rounded-xl px-3 outline-none border-2 focus:ring-4",
          "text-[#1C1C1C]",          // <-- color del texto escrito
          "placeholder:text-[#6B7280]", // <-- color del placeholder (gris 500)
          "caret-[#1C1C1C]",         // <-- color del cursor
          "bg-white",                // <-- fondo blanco para máximo contraste
          className,
        ].join(" ")}
        style={{ borderColor: "#E0E0E0" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#4A90E2")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#E0E0E0")}
        {...props}
      />
    </label>
  );
}
