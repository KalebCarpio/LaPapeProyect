"use client";
import Header from "@/components/Header";
import { ordersGet } from "@/lib/storage";

export default function PedidoDetallePage({ params }){
  const { folio } = params ?? {};
  const order = ordersGet().find(o => o.folio === folio);

  return (
    <>
      <Header/>
      <section className="max-w-5xl mx-auto px-6 py-10">
        {!order && <div>Pedido no encontrado</div>}
        {order && (
          <>
            <h1 className="text-2xl font-bold mb-4">Pedido {order.folio}</h1>
            <div className="mb-4 text-sm text-[#666]">
              {new Date(order.date).toLocaleString()} — Estado: {order.status}
            </div>
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Productos</h2>
              <ul className="list-disc pl-6">
                {order.items?.map((it, idx)=>(
                  <li key={idx}>{it.title || it.titulo} x{it.qty || 1} — ${it.price || it.precio}</li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Envío</h2>
              <div className="text-sm">
                {order.shippingMethod?.toUpperCase()} — {order.address?.calle}, {order.address?.colonia}, {order.address?.cp}, {order.address?.ciudad}, {order.address?.estado}
              </div>
            </div>
            <div className="font-bold">Total: ${order.total}</div>
          </>
        )}
      </section>
    </>
  );
}
