"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const METHODS = [
  {
    value: "PASSWORD_ONLY",
    title: "Solo contraseña",
    description: "Inicio de sesión clásico usando únicamente tu contraseña.",
    badge: "Rápido",
    accent: "bg-amber-100 text-amber-800",
    icon: "🔓",
  },
  {
    value: "PASSWORD_2FA",
    title: "Contraseña + 2FA por correo",
    description: "Te enviamos un código de 6 dígitos a tu correo en cada acceso.",
    badge: "Recomendado",
    accent: "bg-emerald-100 text-emerald-800",
    icon: "📨",
  },
  {
    value: "PASSWORD_SECRET",
    title: "Contraseña + pregunta secreta",
    description: "Respondes una pregunta personal después de la contraseña.",
    badge: "Seguro",
    accent: "bg-indigo-100 text-indigo-800",
    icon: "🧩",
  },
];

const normalizeMethod = (user) => {
  if (user?.loginMethod) return user.loginMethod;
  if (user?.twoFAEnabled) return "PASSWORD_2FA";
  return "PASSWORD_ONLY";
};

// Resuelve a qué panel mandar según el rol del usuario
const resolveHomePath = (user) => {
  const role = user?.role || user?.rol || user?.tipo;
  if (!role) return "/";
  const r = String(role).toLowerCase();
  if (r.includes("trab")) return "/trabajador";
  if (r.includes("client")) return "/cliente";
  if (r.includes("due") || r.includes("duen") || r.includes("owner") || r.includes("admin"))
    return "/dueno";
  return "/";
};

export default function ConfigPage() {
  const { user: authUser, token, login: authLogin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState("PASSWORD_2FA");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hasSecretQuestion, setHasSecretQuestion] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const remember = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("token"));
  }, []);

  const homePath = useMemo(() => resolveHomePath(authUser), [authUser]);

  const applyUserData = (userData) => {
    if (!userData) return;
    setMethod(normalizeMethod(userData));
    setQuestion(userData.secretQuestion || "");
    setHasSecretQuestion(Boolean(userData.hasSecretQuestion));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api("/auth/me", { method: "GET" });
        applyUserData(res.user);
        if (res.user && token) {
          authLogin({ user: res.user, token, remember });
        }
      } catch (err) {
        if (authUser) {
          setError(err.message || "No se pudo cargar tu configuración");
        }
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      applyUserData(authUser);
      setLoading(false);
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (method === "PASSWORD_SECRET") {
      if (!question.trim()) {
        setError("Debes definir la pregunta secreta");
        return;
      }
      if (!hasSecretQuestion && !answer.trim()) {
        setError("Debes ingresar la respuesta para activarla");
        return;
      }
    }

    try {
      setSaving(true);
      const res = await api("/auth/login-method", {
        method: "PATCH",
        body: {
          method,
          question: method === "PASSWORD_SECRET" ? question : undefined,
          answer: method === "PASSWORD_SECRET" ? answer : undefined,
        },
      });

      applyUserData(res.user);
      setHasSecretQuestion(Boolean(res.user?.hasSecretQuestion));
      setAnswer("");
      setMessage(res.message || "Método actualizado correctamente");

      if (res.user && token) {
        authLogin({ user: res.user, token, remember });
      }
    } catch (err) {
      setError(err.message || "No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#FFF9E6] via-[#FDFDFE] to-white">
        <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14">
          {/* Encabezado + resumen */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mb-8 lg:mb-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {homePath && (
                  <button
                    type="button"
                    onClick={() => router.push(homePath)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] transition"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver a mi panel</span>
                  </button>
                )}
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFEAA0] px-3 py-1 text-xs font-semibold text-[#5C4300]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5C4300]" />
                  Centro de seguridad de La Pape
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-[#222] tracking-tight">
                Seguridad de inicio de sesión
              </h1>
              <p className="mt-3 text-sm md:text-base text-black/70 max-w-xl">
                Define cómo quieres proteger tu cuenta. Puedes elegir entre un inicio de
                sesión clásico o agregar una capa extra de seguridad con 2FA o pregunta
                secreta.
              </p>
            </div>

            {/* Tarjeta lateral de estado */}
            <div className="w-full lg:w-72">
              <div className="h-full rounded-2xl bg-white/80 shadow-[0_18px_40px_rgba(15,23,42,0.08)] border border-[#F3F4F6] px-4 py-4 sm:px-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-[0.12em]">
                    Estado de seguridad
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      loading ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                    {loading ? "Cargando..." : "Configuración activa"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-[#374151]">
                  <p className="font-medium">
                    Método actual:{" "}
                    <span className="font-semibold text-[#1D6FD1]">
                      {METHODS.find((m) => m.value === method)?.title ?? "Sin configurar"}
                    </span>
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Puedes cambiar tu método cuando quieras. Te recomendamos usar
                    verificación adicional para compras y accesos importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta principal */}
          <div className="bg-white/90 backdrop-blur-sm border border-[#E5E7EB] shadow-[0_18px_40px_rgba(15,23,42,0.06)] rounded-3xl p-5 sm:p-6 md:p-8">
            <form onSubmit={onSubmit} className="space-y-8">
              {/* Selección de método */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#111827]">
                      Elige tu método de acceso
                    </h2>
                    <p className="text-sm text-[#6B7280]">
                      Solo una opción puede estar activa a la vez. Puedes cambiarla en
                      cualquier momento.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {METHODS.map((option) => {
                    const isActive = method === option.value;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => setMethod(option.value)}
                        className={`group text-left rounded-2xl border transition-all p-4 h-full flex flex-col justify-between ${
                          isActive
                            ? "border-[#1D6FD1] bg-[#E9F3FF] shadow-md shadow-[#1D6FD1]/10"
                            : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:-translate-y-0.5 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                isActive ? "bg-[#1D6FD1] text-white" : "bg-[#F3F4F6] text-[#4B5563]"
                              } text-lg`}
                            >
                              {option.icon}
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-[#111827]">
                                {option.title}
                              </h3>
                              <p className="mt-1 text-xs text-[#6B7280]">
                                {option.description}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-[11px] rounded-full font-semibold uppercase tracking-wide ${option.accent}`}
                          >
                            {option.badge}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B7280]">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                                isActive
                                  ? "border-[#1D6FD1] text-[#1D6FD1]"
                                  : "border-[#D1D5DB] text-[#9CA3AF]"
                              }`}
                            >
                              {isActive ? "●" : "○"}
                            </span>
                            {isActive ? "Seleccionado" : "Seleccionar"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Configuración de pregunta secreta */}
              {method === "PASSWORD_SECRET" && (
                <section className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 md:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F97316]/10 text-[#EA580C] text-sm">
                      🧠
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-[#111827]">
                        Configura tu pregunta secreta
                      </h3>
                      <p className="text-sm text-[#6B7280]">
                        Se utilizará como segundo factor cuando inicies sesión. Tu
                        respuesta se almacena de forma cifrada para proteger tu
                        información.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Pregunta secreta"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="¿Cuál es el nombre de tu primera mascota?"
                    />
                    <Input
                      label="Respuesta"
                      type="password"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={
                        hasSecretQuestion
                          ? "Ingresa una nueva respuesta (opcional)"
                          : "Escribe tu respuesta"
                      }
                      helperText={
                        hasSecretQuestion
                          ? "Si dejas este campo vacío, conservaremos tu respuesta actual."
                          : "Necesitamos una respuesta para activar este método."
                      }
                    />
                  </div>
                </section>
              )}

              {(error || message) && (
                <div className="space-y-2">
                  {error && (
                    <p className="text-sm rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
                      {error}
                    </p>
                  )}
                  {message && (
                    <p className="text-sm rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                      {message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between flex-col md:flex-row gap-3">
                <p className="text-xs md:text-sm text-[#6B7280]">
                  Los cambios se aplican al próximo inicio de sesión. Puedes volver aquí
                  cuando quieras para cambiar el método.
                </p>
                <PrimaryButton
                  type="submit"
                  disabled={saving || loading}
                  className="px-6 min-w-[210px]"
                >
                  {saving ? "Guardando cambios..." : "Guardar preferencia"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
