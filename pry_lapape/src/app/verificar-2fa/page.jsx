"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api, decodeJWT } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const CODE_LENGTH = 6;

function Verificar2FAContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [codeDigits, setCodeDigits] = useState(
    Array(CODE_LENGTH).fill("")
  );
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const inputRefs = useRef([]);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pending-2fa");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.email) setEmail(parsed.email);
      if (typeof parsed.remember === "boolean") setRemember(parsed.remember);
      if (parsed.user) setPendingUser(parsed.user);
    } catch (err) {
      console.warn("No se pudo leer el estado pendiente de 2FA", err);
    }
  }, []);

  const normalizeUser = (rawUser, fallbackEmail, token) => {
    const payload = token ? decodeJWT(token) : {};
    const role = (
      rawUser?.role ||
      rawUser?.rol ||
      payload?.role ||
      payload?.rol ||
      "CLIENTE"
    ).toUpperCase();

    return {
      id: rawUser?.id || payload?.id || payload?._id || "",
      nombre: rawUser?.nombre || payload?.nombre || "",
      email: rawUser?.email || payload?.email || fallbackEmail,
      role,
      rol: role,
      isVerified: rawUser?.isVerified ?? payload?.isVerified ?? true,
      twoFAEnabled: rawUser?.twoFAEnabled ?? payload?.twoFAEnabled ?? false,
      loginMethod:
        rawUser?.loginMethod ||
        payload?.loginMethod ||
        (rawUser?.twoFAEnabled || payload?.twoFAEnabled ? "PASSWORD_2FA" : "PASSWORD_ONLY"),
      secretQuestion: rawUser?.secretQuestion || payload?.secretQuestion || "",
      hasSecretQuestion: rawUser?.hasSecretQuestion ?? payload?.hasSecretQuestion ?? false,
      lastLoginAt: rawUser?.lastLoginAt || payload?.lastLoginAt || null,
    };
  };

  const goToDashboard = (role) => {
    const normalized = (role || "").toUpperCase();
    if (normalized === "DUENO" || normalized === "ADMIN") {
      router.push("/dueño");
    } else if (normalized === "TRABAJADOR" || normalized === "EMPLEADO") {
      router.push("/trabajador");
    } else {
      router.push("/cliente");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email || !code) {
      alert("Debes ingresar el correo y el código enviado.");
      return;
    }

    try {
      setLoading(true);
      const res = await api("/auth/verify-2fa", { body: { email, code } });
      const user = normalizeUser(res.user || pendingUser, email, res.token);
      authLogin({ user, token: res.token, remember });

      try {
        sessionStorage.removeItem("pending-2fa");
      } catch (storageErr) {
        console.warn("No se pudo limpiar el estado pendiente de 2FA", storageErr);
      }

      goToDashboard(user.role || user.rol);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Error al validar el código 2FA");
    } finally {
      setLoading(false);
    }
  };

  const hasPrefilledEmail = Boolean(initialEmail || pendingUser?.email);

  // --- Manejo del código en casillas (mismo estilo que verificar correo) ---

  const handleChangeDigit = (index, value) => {
    const cleanValue = value.replace(/\s/g, "").slice(-1);
    const nextDigits = [...codeDigits];
    nextDigits[index] = cleanValue;
    setCodeDigits(nextDigits);
    setCode(nextDigits.join(""));

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
          <span>Paso extra · Verificación 2FA</span>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-[#222]">
          Verificar código 2FA
        </h1>
        <p className="text-sm text-[#666]">
          Ingresa el código de <span className="font-semibold">6 dígitos</span>{" "}
          enviado a tu correo para confirmar tu inicio de sesión.
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
          {/* Correo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#444]">
              Correo electrónico
            </label>
            <Input
              label=""
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={hasPrefilledEmail}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          {/* Código letra por letra */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#444]">
              Código de verificación 2FA
            </label>
            <p className="text-xs text-[#888]">
              Escribe el código que aparece en tu correo. También puedes pegarlo
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
                  onChange={(e) => handleChangeDigit(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  ref={(el) => (inputRefs.current[index] = el)}
                />
              ))}
            </div>
          </div>

          {/* Recordar sesión */}
          <div className="flex items-center justify-between text-sm mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#555]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#EC5DBB] text-[#EC5DBB] focus:ring-[#F7A8DA]"
              />
              Mantener sesión iniciada en este dispositivo
            </label>
          </div>

          <PrimaryButton
            className="w-full py-3 rounded-xl mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? "Validando..." : "Confirmar código 2FA"}
          </PrimaryButton>

          <p className="text-xs text-center text-[#999] mt-2">
            Si no recibiste el código, verifica tu carpeta de{" "}
            <span className="font-semibold">Spam</span> o{" "}
            <span className="font-semibold">Correo no deseado</span>.
          </p>
        </form>
      </section>
    </main>
  );
}

export default function Verificar2FA() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">Cargando verificación…</main>}>
        <Verificar2FAContent />
      </Suspense>
    </>
  );
}
