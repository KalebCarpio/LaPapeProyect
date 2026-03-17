"use client";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { checkoutGet, checkoutSet, cartGet, cartSet, ordersGet, ordersSet } from "@/lib/storage";

export default function PagoPage(){
  const router = useRouter();

  const pagar = (aprobado) => {
    const ck = checkoutGet();
    if(!ck.address || !ck.shippingMethod){
      router.push("/checkout/error");
      return;
    }

    if(!aprobado){
      router.push("/checkout/error");
      return;
    }

    // crear pedido simulado
    const folio = "LP-"+Math.floor(100000+Math.random()*899999);
    const items = cartGet();
    const total = items.reduce((s,i)=> s + (i.price || i.precio || 0) * (i.qty || 1), 0);

    const orders = ordersGet();
    orders.push({
      folio,
      date: new Date().toISOString(),
      total,
      status: "pagado",
      items,
      address: ck.address,
      shippingMethod: ck.shippingMethod
    });
    ordersSet(orders);

    cartSet([]);
    checkoutSet({ address:null, shippingMethod:null, paymentMethod:null, paymentData:null });

    router.push(`/checkout/confirmacion?folio=${folio}`);
  };

  return (
    <>
      <Header/>
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-4">Pago</h1>
        <p className="text-sm text-[#666] mb-6">Simula la transacción: Aprobado o Rechazado.</p>

        <div className="grid gap-2 mb-4">
          <label className="text-sm">Titular</label>
          <input className="border rounded p-2" placeholder="Nombre en la tarjeta"/>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded p-2" placeholder="Número (simulado)"/>
            <input className="border rounded p-2" placeholder="MM/AA • CVV"/>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={()=>pagar(false)} className="px-4 py-2 rounded border">Simular Rechazo</button>
          <button onClick={()=>pagar(true)} className="px-4 py-2 rounded bg-[#27AE60] text-white">Simular Aprobado</button>
          <button onClick={()=>router.push("/checkout/metodo-envio")} className="px-4 py-2 rounded border">Atrás</button>
        </div>
      </section>
    </>
  );
}
