"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api } from "@/lib/api";

const CODE_LENGTH = 6;

function VerificarCorreoContent() {
  const params = useSearchParams();
  const router = useRouter();
  const emailQ = params.get("email") || "";
  const codeQ = params.get("code") || "";

  const [email, setEmail] = useState(emailQ);
  const [code, setCode] = useState(codeQ);
  const [codeDigits, setCodeDigits] = useState(
    Array(CODE_LENGTH).fill("")
  );
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  // Sincroniza email y código desde la URL
  useEffect(() => {
    if (emailQ) setEmail(emailQ);
    if (codeQ) {
      setCode(codeQ);
      const nextDigits = Array(CODE_LENGTH).fill("");
      codeQ
        .split("")
        .slice(0, CODE_LENGTH)
        .forEach((char, idx) => {
          nextDigits[idx] = char;
        });
      setCodeDigits(nextDigits);
    }
  }, [emailQ, codeQ]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api("/auth/verify-email", { body: { email, code } });
      alert("Correo verificado. Ya puedes iniciar sesión.");
      router.push(`/login?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Ocurrió un error al verificar el correo.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDigit = (index, value) => {
    const cleanValue = value.replace(/\s/g, "").slice(-1); // último carácter
    const nextDigits = [...codeDigits];
    nextDigits[index] = cleanValue;
    setCodeDigits(nextDigits);
    setCode(nextDigits.join(""));

    // Avanza al siguiente input si se escribió algo
    if (cleanValue && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").trim();
    if (!paste) return;
    e.preventDefault();

    const chars = paste.replace(/\s/g, "").split("");
    const nextDigits = Array(CODE_LENGTH).fill("");

    for (let i = 0; i < CODE_LENGTH && i < chars.length; i++) {
      nextDigits[i] = chars[i];
    }

    setCodeDigits(nextDigits);
    setCode(nextDigits.join(""));

    const lastFilled = Math.min(chars.length, CODE_LENGTH) - 1;
    if (lastFilled >= 0) {
      inputRefs.current[lastFilled]?.focus();
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-b from-[#FFF9E6] to-white px-4 py-10">
      <section className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-[#FFE4B5] p-8">
        {/* Etiqueta superior */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3D9] text-xs font-medium text-[#B5731F] mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-[#F5A623]" />
          <span>Paso 2 · Verificación de correo</span>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-[#222]">
          Verificar correo
        </h1>
        <p className="text-sm text-[#666]">
          Ingresa el código de <span className="font-semibold">6 dígitos</span>{" "}
          que enviamos a tu correo electrónico para confirmar tu cuenta.
        </p>

        {/* Chip con el correo */}
        {email && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F0FF] text-xs text-[#5C34A0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
            <span className="font-medium truncate max-w-[210px]">
              {email}
            </span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {/* Campo de correo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#444]">
              Correo electrónico
            </label>
            <Input
              label=""
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          {/* Código letra por letra */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#444]">
              Código de verificación
            </label>
            <p className="text-xs text-[#888]">
              Escribe el código que aparece en el correo. Puedes pegarlo
              completo en la primera casilla.
            </p>
            <div className="flex justify-between gap-2">
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-11 h-12 md:w-12 md:h-14 rounded-xl border border-[#FFD3EC] bg-[#FFF7FD] text-center text-xl font-semibold tracking-widest text-[#EC5DBB] outline-none focus:border-[#EC5DBB] focus:ring-2 focus:ring-[#F7A8DA] transition-all"
                  value={digit}
                  onChange={(e) =>
                    handleChangeDigit(index, e.target.value)
                  }
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  ref={(el) => (inputRefs.current[index] = el)}
                />
              ))}
            </div>
          </div>

          <PrimaryButton
            className="w-full py-3 rounded-xl mt-2"
            disabled={loading}
          >
            {loading ? "Verificando..." : "Verificar correo"}
          </PrimaryButton>

          <p className="text-xs text-center text-[#999] mt-2">
            Si no encuentras el correo, revisa tu carpeta de{" "}
            <span className="font-semibold">Spam</span> o{" "}
            <span className="font-semibold">Correo no deseado</span>.
          </p>
        </form>
      </section>
    </main>
  );
}

export default function VerificarCorreoPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">Cargando verificación…</main>}>
        <VerificarCorreoContent />
      </Suspense>
    </>
  );
}
