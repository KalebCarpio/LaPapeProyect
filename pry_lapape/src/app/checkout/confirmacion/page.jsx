"use client";
import Header from "@/components/Header";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ConfirmacionContent() {
  const router = useRouter();
  const search = useSearchParams();
  const folio = search.get("folio") || "LP-XXXXXX";

  return (
    <section className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">¡Gracias por tu compra!</h1>
      <p className="mb-6 text-sm text-[#666]">Folio: <b>{folio}</b></p>
      <div className="flex gap-2">
        <button onClick={() => router.push("/perfil/pedidos")} className="px-4 py-2 rounded bg-[#4A90E2] text-white">Ver mis pedidos</button>
        <button onClick={() => router.push("/catalogo")} className="px-4 py-2 rounded border">Seguir comprando</button>
      </div>
    </section>
  );
}

export default function ConfirmacionPage(){
  return (
    <>
      <Header/>
      <Suspense fallback={<section className="max-w-3xl mx-auto px-6 py-10">Cargando confirmación…</section>}>
        <ConfirmacionContent />
      </Suspense>
    </>
  );
}
