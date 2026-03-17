"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api } from "@/lib/api";

function ResetPasswordContent() {
  const params = useSearchParams();
  const emailQ = params.get("email") || "";
  const [email, setEmail] = useState(emailQ);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const onSubmit = async (e)=>{
    e.preventDefault();
    try{
      await api("/auth/reset-password", { body: { email, code, newPassword: password }});
      alert("Contraseña actualizada. Inicia sesión.");
      router.push(`/login?email=${encodeURIComponent(email)}`);
    }catch(err){ alert(err.message); }
  };

  return (
    <section className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Crear nueva contraseña</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Correo" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <Input label="Código" placeholder="OTP recibido" value={code} onChange={e=>setCode(e.target.value)}/>
        <Input label="Nueva contraseña" type="password" placeholder="Mínimo 8" value={password} onChange={e=>setPassword(e.target.value)}/>
        <PrimaryButton className="w-full py-3">Actualizar</PrimaryButton>
      </form>
    </section>
  );
}

export default function ResetPassword(){
  return (
    <>
      <Header/>
      <Suspense fallback={<section className="max-w-md mx-auto p-6">Cargando formulario…</section>}>
        <ResetPasswordContent />
      </Suspense>
    </>
  );
}
