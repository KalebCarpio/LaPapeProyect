"use client";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { checkoutGet, checkoutSet } from "@/lib/storage";

export default function MetodoEnvioPage(){
  const router = useRouter();

  const elegir = (m) => {
    const ck = checkoutGet();
    ck.shippingMethod = m;
    checkoutSet(ck);
    router.push("/checkout/pago");
  };

  return (
    <>
      <Header/>
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-4">Método de envío</h1>
        <div className="grid gap-3">
          <button onClick={()=>elegir("estandar")} className="p-3 rounded border hover:bg-[#fafafa]">Estándar (3-5 días)</button>
          <button onClick={()=>elegir("expres")} className="p-3 rounded border hover:bg-[#fafafa]">Exprés (24-48h)</button>
          <button onClick={()=>elegir("pickup")} className="p-3 rounded border hover:bg-[#fafafa]">Pick-up (sucursal)</button>
        </div>
        <div className="mt-6">
          <button onClick={()=>router.push("/checkout/envio")} className="px-4 py-2 rounded border">Atrás</button>
        </div>
      </section>
    </>
  );
}
