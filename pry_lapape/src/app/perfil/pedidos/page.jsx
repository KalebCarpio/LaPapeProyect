"use client";
import { useMemo } from "react";
import Link from "next/link";
import RoleLayout from "@/components/RoleLayout";
import { ordersGet } from "@/lib/storage";

export default function PerfilPedidosPage() {
  const orders = useMemo(() => ordersGet(), []);

  return (
    <RoleLayout
      requiredRole="CLIENTE"
      title="Mis pedidos"
      subtitle="Consulta el historial generado en esta sesión local."
    >
      <section className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-6 text-sm text-[#4B5563]">
            Todavía no hay pedidos guardados. Completa un checkout simulado para verlos aquí.
          </div>
        ) : (
          orders
            .slice()
            .reverse()
            .map((order) => (
              <Link
                key={order.folio}
                href={`/perfil/pedidos/${order.folio}`}
                className="block rounded-2xl bg-white border border-black/10 p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-[#1F2933]">{order.folio}</h2>
                    <p className="text-sm text-black/60">
                      {new Date(order.date).toLocaleString()} · {order.items?.length || 0} productos
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-[#1D6FD1]">
                    Total: ${Number(order.total || 0).toFixed(2)}
                  </div>
                </div>
              </Link>
            ))
        )}
      </section>
    </RoleLayout>
  );
}
