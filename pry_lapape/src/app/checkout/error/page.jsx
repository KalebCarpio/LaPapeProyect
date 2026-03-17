"use client";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

export default function ErrorPagoPage(){
  const router = useRouter();
  return (
    <>
      <Header/>
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[#B00020] mb-4">Error en pago / Datos inválidos</h1>
        <p className="text-sm text-[#666] mb-6">Corrige los datos o intenta con otro método.</p>
        <div className="flex gap-2">
          <button onClick={()=>router.push("/checkout/pago")} className="px-4 py-2 rounded bg-[#F2C94C]">Intentar de nuevo</button>
          <button onClick={()=>router.push("/carrito")} className="px-4 py-2 rounded border">Volver al carrito</button>
        </div>
      </section>
    </>
  );
}
