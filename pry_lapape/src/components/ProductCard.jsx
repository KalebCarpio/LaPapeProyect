// src/components/ProductCard.jsx
"use client";
import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { cartGet, cartSet } from "@/lib/storage";

export default function ProductCard({
  title,
  price,
  badge,
  image,
  onAdd,          // opcional: si lo pasas, se usa; si no, usamos addDefault()
}) {
  const addDefault = () => {
    const cart = cartGet();
    cart.push({ id: title, title, price, qty: 1, image });
    cartSet(cart);
    // Puedes cambiar este alert por un toast si tienes componente
    alert(`Agregado: ${title}`);
  };

  return (
    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Imagen del producto */}
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#FFF9E6]">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-[#d0d0d0]">
              <Star size={28} />
            </div>
          )}
        </div>

        {badge && (
          <span className="absolute top-2 left-2 rounded-full bg-[#FFD54F] px-2.5 py-1 text-xs font-bold text-[#1C1C1C] shadow">
            {badge}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-1 font-semibold text-[#1C1C1C]">{title}</h3>
        <div className="text-xs text-[#888]">Papelería escolar</div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-[#1C1C1C]">
            <span className="text-sm align-top">$</span>
            <span className="text-lg font-bold">{price}</span>
            <span className="ml-1 text-xs text-[#888]">IVA incl.</span>
          </div>

          <button
            onClick={onAdd ? onAdd : addDefault}
            className="inline-flex items-center gap-2 rounded-full bg-[#FFD54F] px-4 py-2 text-sm font-bold text-[#1C1C1C] hover:bg-[#f6c842] transition-colors"
          >
            <ShoppingCart size={16} />
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
