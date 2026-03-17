"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function OlvidePassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Ingresa el correo asociado a tu cuenta.");
      return;
    }

    try {
      setLoading(true);
      await api("/auth/forgot-password", { body: { email } });

      alert("Si el correo existe, enviaremos un código a tu correo electrónico.");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      alert(err.message || "Ocurrió un error al solicitar el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      {/* Fondo oscuro tipo La Pape */}
      <main className="min-h-[calc(100vh-80px)] bg-[#030712] flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-xl">
          {/* Tarjeta principal */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111827] via-[#020617] to-[#020617] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
            {/* Glows dorados */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-40 w-40 rounded-full bg-[#FACC1530] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-16 h-40 w-40 rounded-full bg-[#FBBF2430] blur-3xl" />

            <div className="relative px-8 py-8 md:px-10 md:py-10 space-y-6">
              {/* Encabezado */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.25em] text-[#FACC15] uppercase">
                  Seguridad de acceso
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Recuperar contraseña
                </h1>
                <p className="text-sm md:text-base text-white/70">
                  Ingresa el correo con el que te registraste en{" "}
                  <span className="font-semibold text-[#FACC15]">La Pape</span>. Te
                  enviaremos un código para que puedas restablecer tu contraseña.
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  {/* Label manual en blanco para mejor contraste */}
                  <label className="block text-sm font-medium text-white">
                    Correo electrónico
                  </label>

                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                  />

                  <p className="text-xs text-white/50">
                    Por seguridad, si el correo no está registrado también mostraremos
                    este mismo mensaje.
                  </p>
                </div>

                <PrimaryButton
                  type="submit"
                  className="w-full py-3 text-base font-semibold shadow-[0_12px_30px_rgba(250,204,21,0.45)]"
                  disabled={loading}
                >
                  {loading ? "Enviando código..." : "Enviar código de recuperación"}
                </PrimaryButton>
              </form>

              {/* Nota extra */}
              <p className="text-[11px] text-white/40">
                Si no ves el correo en tu bandeja de entrada, revisa también la carpeta
                de spam o correo no deseado.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
