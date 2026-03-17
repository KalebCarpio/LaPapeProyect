"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api, decodeJWT } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

function VerificarPreguntaContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pending-secret-question");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.email) setEmail(parsed.email);
      if (parsed.question) setQuestion(parsed.question);
      if (typeof parsed.remember === "boolean") setRemember(parsed.remember);
      if (parsed.user) setPendingUser(parsed.user);
    } catch (err) {
      console.warn("No se pudo leer el estado pendiente de pregunta secreta", err);
    }
  }, []);

  const normalizeUser = (rawUser, fallbackEmail, token) => {
    const payload = token ? decodeJWT(token) : {};
    const role =
      (rawUser?.role || rawUser?.rol || payload?.role || payload?.rol || "CLIENTE").toUpperCase();

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

    if (!email || !answer) {
      alert("Debes ingresar el correo y la respuesta secreta.");
      return;
    }

    try {
      setLoading(true);
      const res = await api("/auth/verify-secret", { body: { email, answer } });
      const user = normalizeUser(res.user || pendingUser, email, res.token);
      authLogin({ user, token: res.token, remember });
      try {
        sessionStorage.removeItem("pending-secret-question");
      } catch (storageErr) {
        console.warn("No se pudo limpiar el estado pendiente de pregunta secreta", storageErr);
      }
      goToDashboard(user.role || user.rol);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Error al validar la respuesta secreta");
    } finally {
      setLoading(false);
    }
  };

  const hasPrefilledEmail = Boolean(initialEmail || pendingUser?.email);

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-b from-[#FFF9E6] to-white px-4 py-10">
      <section className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-[#FFE4B5] p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F3FF] text-xs font-medium text-[#1D6FD1] mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-[#1D6FD1]" />
          <span>Segundo factor · Pregunta secreta</span>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-[#222]">Confirma tu identidad</h1>
        <p className="text-sm text-[#666]">
          Responde tu pregunta secreta para completar el inicio de sesión.
        </p>

        {email && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0F7FF] text-xs text-[#1D6FD1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D6FD1]" />
            <span className="font-medium truncate max-w-[210px]">{email}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#444]">Correo electrónico</label>
            <Input
              label=""
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={hasPrefilledEmail}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#444]">Pregunta secreta</label>
            <p className="text-sm text-[#555] bg-[#F7F9FC] border border-[#E0E7FF] rounded-xl p-3">
              {question || "No se encontró una pregunta definida para esta cuenta."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#444]">Respuesta</label>
            <Input
              label=""
              type="password"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Escribe tu respuesta secreta"
            />
          </div>

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 text-lg font-bold"
          >
            {loading ? "Validando..." : "Confirmar y continuar"}
          </PrimaryButton>
        </form>
      </section>
    </main>
  );
}

export default function VerificarPreguntaPage() {
  return (
    <Suspense fallback={<p className="p-8">Cargando...</p>}>
      <Header />
      <VerificarPreguntaContent />
    </Suspense>
  );
}
