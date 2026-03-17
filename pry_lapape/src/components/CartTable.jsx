"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartTable({ items: initialItems, onTotalsChange }) {
  const start = useMemo(() => initialItems ?? [], [initialItems]);
  const [items, setItems] = useState(start);

  const updateQty = (id, delta) =>
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
    );

  const removeItem = id => setItems(prev => prev.filter(it => it.id !== id));

  const currency = v => `$ ${v.toFixed(2)}`;
  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);

  // Notifica a la página cada vez que cambien los items o cantidades
  useEffect(() => {
    onTotalsChange?.({ subtotal, items });
  }, [subtotal, items, onTotalsChange]);

  return (
    <div className="w-full">
      {/* Encabezados */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#F9FAFB] text-xs font-semibold text-[#666]">
        <div className="col-span-6">Producto</div>
        <div className="col-span-2 text-right">Precio</div>
        <div className="col-span-2 text-center">Cantidad</div>
        <div className="col-span-2 text-right">Subtotal</div>
      </div>

      {/* Filas */}
      <div className="divide-y divide-[#F0F0F0]">
        {items.map(it => (
          <div key={it.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 bg-white">
            {/* Producto: imagen + info */}
            <div className="col-span-6 flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-1 ring-black/5 bg-white">
                {it.image ? (
                  <Image src={it.image} alt={it.title} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-[#d0d0d0]">🖼️</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[#1C1C1C] truncate">{it.title}</div>
                <div className="text-xs text-[#888]">SKU: {it.sku}</div>
                <button
                  onClick={() => removeItem(it.id)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-[#EC5DBB] hover:text-[#D54AA8]"
                >
                  <Trash2 size={14} /> Quitar
                </button>
              </div>
            </div>

            {/* Precio */}
            <div className="col-span-2 text-right text-[#1C1C1C] font-medium">
              {currency(it.price)}
            </div>

            {/* Cantidad */}
            <div className="col-span-2">
              <div className="mx-auto w-28 h-10 rounded-xl border border-[#E0E0E0] flex items-center justify-between px-2">
                <button
                  onClick={() => updateQty(it.id, -1)}
                  className="p-1 rounded-lg hover:bg-[#F5F5F5]"
                  aria-label="Disminuir"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold text-[#1C1C1C]">{it.qty}</span>
                <button
                  onClick={() => updateQty(it.id, +1)}
                  className="p-1 rounded-lg hover:bg-[#F5F5F5]"
                  aria-label="Aumentar"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="col-span-2 text-right font-bold text-[#1C1C1C]">
              {currency(it.price * it.qty)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer tabla */}
      <div className="flex justify-end px-6 py-4 bg-[#F9FAFB]">
        <div className="text-right">
          <div className="text-sm text-[#666]">Subtotal</div>
          <div className="text-xl font-bold text-[#1C1C1C]">{currency(subtotal)}</div>
        </div>
      </div>
    </div>
  );
}
