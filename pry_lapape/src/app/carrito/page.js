"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import CartTable from "@/components/CartTable";
import { productos } from "@/lib/mock";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { ChevronRight, CheckCircle2, Shield, Truck, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cartGet, cartSet } from "@/lib/storage";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CarritoPage() {
  const router = useRouter();
  const cuponRef = useRef(null);

  // Ítems demo por si el carrito está vacío (se siembran una sola vez)
  const demoItems = useMemo(
    () => [
      { id: productos[0].id, title: productos[0].titulo, price: productos[0].precio, image: productos[0].image, sku: "SKU-001", qty: 1 },
      { id: productos[1].id, title: productos[1].titulo, price: productos[1].precio, image: productos[1].image, sku: "SKU-002", qty: 2 },
      { id: productos[2].id, title: productos[2].titulo, price: productos[2].precio, image: productos[2].image, sku: "SKU-003", qty: 1 },
      { id: productos[3].id, title: productos[3].titulo, price: productos[3].precio, image: productos[3].image, sku: "SKU-004", qty: 1 },
    ],
    []
  );

  // Estado del carrito (persistente)
  const [summary, setSummary] = useState({
    items: [],
    subtotal: 0,
  });

  // Estado de descuentos/impuestos/envío simulados
  const [discount, setDiscount] = useState(10); // $10 demo o 10% si aplicas cupón
  const [shipping, setShipping] = useState(0);
  const [taxes, setTaxes] = useState(0);

  // Inicializa desde localStorage; si está vacío, siembra con demoItems
  useEffect(() => {
    const stored = cartGet();
    if (!stored || stored.length === 0) {
      cartSet(demoItems);
      setSummary({
        items: demoItems,
        subtotal: demoItems.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 1), 0),
      });
    } else {
      setSummary({
        items: stored,
        subtotal: stored.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 1), 0),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando CartTable cambie cantidades/eliminaciones
  const handleTotalsChange = ({ subtotal, items }) => {
    cartSet(items);
    setSummary({ subtotal, items });
  };

  // Moneda
  const currency = (v) => `$ ${Number(v || 0).toFixed(2)}`;

  // Cupón: LAPAPE10 => 10% del subtotal (reemplaza el descuento fijo)
  const aplicarCupon = () => {
    const code = (cuponRef.current?.value || "").trim().toUpperCase();
    if (!code) return;
    if (code === "LAPAPE10") {
      const descuento = Math.round(summary.subtotal * 0.1 * 100) / 100;
      setDiscount(descuento);
      alert("Cupón aplicado: 10% de descuento");
    } else {
      setDiscount(10); // regresa a descuento demo fijo
      alert("Cupón inválido. Se mantiene el descuento demo de $10.00");
    }
  };

  // Vaciar carrito
  const vaciarCarrito = () => {
    cartSet([]);
    setSummary({ items: [], subtotal: 0 });
  };

  // Totales finales
  const total = Math.max(0, (summary.subtotal || 0) - (discount || 0) + (shipping || 0) + (taxes || 0));

  return (
    <>
      <Header />

      {/* Migas de pan (Breadcrumbs) */}
      <section className="py-6 bg-gradient-to-r from-[#FFF9E6] to-[#FFFDEF]">
        <div className="max-w-6xl mx-auto px-6">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Carrito de compras" },
            ]}
          />
        </div>
      </section>

      {/* Contenido principal */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-8">
          {/* Sección del carrito - Ocupa 2 columnas */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#FFD54F] rounded-full flex items-center justify-center" />
              <h1 className="text-3xl font-bold text-[#1C1C1C]">Tu Carrito</h1>
              <span className="px-3 py-1 bg-[#4A90E2] text-white rounded-full text-sm font-medium">
                {summary.items.length} productos
              </span>
            </div>

            {/* Tabla del carrito */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#F0F0F0] overflow-hidden">
              <CartTable items={summary.items} onTotalsChange={handleTotalsChange} />
            </div>

            {/* Acciones secundarias */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <SecondaryButton onClick={() => router.push("/catalogo")} className="flex items-center gap-3 px-6 py-3">
                <ArrowLeft size={18} />
                Continuar comprando
              </SecondaryButton>

              <button
                onClick={vaciarCarrito}
                className="flex items-center gap-3 px-6 py-3 text-[#4A90E2] font-semibold hover:text-[#2D7BE0] transition-colors"
              >
                <span>🗑️</span>
                Vaciar carrito
              </button>
            </div>

            {/* Información de envío */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-[#2DC5A1]/5 to-[#4A90E2]/5 border border-[#2DC5A1]/20">
              <div className="flex items-center gap-3 mb-3">
                <Truck className="text-[#2DC5A1]" size={20} />
                <h3 className="font-semibold text-[#1C1C1C]">Envío gratis disponible</h3>
              </div>
              <p className="text-[#666666] text-sm">¡Falta poco! Agrega más productos y obtén envío gratis (simulado).</p>
            </div>
          </div>

          {/* Sidebar de resumen - Ocupa 1 columna */}
          <aside className="space-y-6">
            {/* Resumen */}
            <div className="rounded-2xl shadow-lg border border-[#F0F0F0] bg-white p-6 space-y-4 sticky top-6">
              <h3 className="text-xl font-bold text-[#1C1C1C] border-b border-[#E0E0E0] pb-3">Resumen del Pedido</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-[#333333]">
                  <span>Subtotal ({summary.items.length} productos)</span>
                  <span className="font-semibold">{currency(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#333333]">
                  <span>Envío</span>
                  <div className="text-right">
                    <span className="line-through text-[#666666] mr-2">{currency(79)}</span>
                    <span className="text-[#2DC5A1] font-semibold">{currency(shipping)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-[#333333]">
                  <span>Impuestos</span>
                  <span className="font-semibold">{currency(taxes)}</span>
                </div>
                <div className="flex justify-between text-[#333333]">
                  <span>Descuento</span>
                  <span className="text-[#EC5DBB] font-semibold">-{currency(discount)}</span>
                </div>
              </div>

              <div className="border-t border-[#E0E0E0] pt-4 flex justify-between text-lg font-bold text-[#1C1C1C]">
                <span>Total</span>
                <span>{currency(total)}</span>
              </div>

              <PrimaryButton
                onClick={() => router.push("/checkout/envio")}
                className="w-full flex items-center justify-center gap-3 py-4 text-lg font-bold mt-4"
              >
                Finalizar compra
                <ChevronRight size={20} />
              </PrimaryButton>

              <p className="text-xs text-center text-[#666666]">
                Al completar tu compra aceptas nuestros
                <a href="#" className="text-[#4A90E2] hover:underline ml-1">
                  términos y condiciones
                </a>
              </p>
            </div>

            {/* Tarjetas de beneficios */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFD54F]/10 to-[#FFF9E6] border border-[#FFD54F]/20">
                <div className="flex items-center gap-3">
                  <Shield className="text-[#4A90E2]" size={20} />
                  <div>
                    <h4 className="font-semibold text-[#1C1C1C] text-sm">Compra 100% segura</h4>
                    <p className="text-[#666666] text-xs">Protegemos tus datos personales</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2DC5A1]/10 to-[#2DC5A1]/5 border border-[#2DC5A1]/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#2DC5A1]" size={20} />
                  <div>
                    <h4 className="font-semibold text-[#1C1C1C] text-sm">Devoluciones fáciles</h4>
                    <p className="text-[#666666] text-xs">30 días para cambiar de opinión</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#AF69EE]/10 to-[#AF69EE]/5 border border-[#AF69EE]/20">
                <div className="flex items-center gap-3">
                  <span className="text-[#AF69EE] text-lg">🎁</span>
                  <div>
                    <h4 className="font-semibold text-[#1C1C1C] text-sm">¡Sorpresa incluida!</h4>
                    <p className="text-[#666666] text-xs">Recibe un regalo especial con tu pedido</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cupón */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EC5DBB]/5 to-[#EC5DBB]/10 border border-[#EC5DBB]/20">
              <h4 className="font-semibold text-[#1C1C1C] text-sm mb-2">¿Tienes un cupón?</h4>
              <div className="flex gap-2">
                <input
                  ref={cuponRef}
                  type="text"
                  placeholder="Código de descuento (LAPAPE10)"
                  className="
                    flex-1 px-3 py-2 rounded-lg border border-[#E0E0E0] text-sm
                    focus:outline-none focus:border-[#4A90E2]
                    text-[#1C1C1C] placeholder:text-[#6B7280] caret-[#1C1C1C] bg-white
                  "
                />
                <button
                  onClick={aplicarCupon}
                  className="px-4 py-2 bg-[#EC5DBB] text-white rounded-lg font-semibold text-sm hover:bg-[#D54AA8] transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
