"use client";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { checkoutGet, checkoutSet } from "@/lib/storage";

export default function EnvioPage(){
  const router = useRouter();

  const continuar = () => {
    const ck = checkoutGet();
    ck.address = {
      nombre:"Demo Cliente",
      tel:"9999999999",
      calle:"Calle 1",
      colonia:"Centro",
      cp:"77500",
      ciudad:"Cancún",
      estado:"Quintana Roo"
    };
    checkoutSet(ck);
    router.push("/checkout/metodo-envio");
  };

  return (
    <>
      <Header/>
      <section className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-4">Dirección de envío</h1>
        <p className="text-sm text-[#666] mb-6">Datos simulados para el flujo.</p>

        {/* Aquí pondrías tu formulario real; por ahora simulamos */}
        <div className="grid gap-3">
          <input className="border rounded p-2" placeholder="Nombre completo" defaultValue="Demo Cliente"/>
          <input className="border rounded p-2" placeholder="Teléfono" defaultValue="9999999999"/>
          <input className="border rounded p-2" placeholder="Calle" defaultValue="Calle 1"/>
          <input className="border rounded p-2" placeholder="Colonia" defaultValue="Centro"/>
          <div className="grid grid-cols-3 gap-3">
            <input className="border rounded p-2" placeholder="CP" defaultValue="77500"/>
            <input className="border rounded p-2" placeholder="Ciudad" defaultValue="Cancún"/>
            <input className="border rounded p-2" placeholder="Estado" defaultValue="Quintana Roo"/>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={()=>router.push("/carrito")} className="px-4 py-2 rounded border">Volver al carrito</button>
          <button onClick={continuar} className="px-4 py-2 rounded bg-[#EC5DBB] text-white">Continuar</button>
        </div>
      </section>
    </>
  );
}
