
"use client";
import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { api } from "@/lib/api";

import {
  UserPlus,
  Package,
  Sparkles,
  Shield,
  Gift,
  Star,
  ArrowLeft,
  UserCircle2,
  Briefcase,
  Crown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ---------- Selector visual de Rol ---------- */
function RoleSelector({ value, onChange }) {
  const roles = [
    { value: "CLIENTE", label: "Cliente", Icon: UserCircle2 },
    { value: "TRABAJADOR", label: "Trabajador", Icon: Briefcase },
    { value: "DUENO", label: "Dueño", Icon: Crown },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-[#666]">Rol</span>
      <div role="radiogroup" aria-label="Selecciona tu rol" className="flex flex-wrap gap-2">
        {roles.map(({ value: v, label, Icon }) => {
          const checked = value === v;
          return (
            <label
              key={v}
              className={`cursor-pointer select-none rounded-xl border px-3 py-2 flex items-center gap-2
                ${checked ? "border-[#4A90E2] bg-[#EAF3FF]" : "border-[#E0E0E0] hover:border-[#4A90E2]"}
                text-[#1C1C1C]`}
            >
              <input
                type="radio"
                name="rol"
                value={v}
                checked={checked}
                onChange={() => onChange(v)}
                className="sr-only"
              />
              <Icon size={18} />
              <span className="text-sm">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Página ------------------------------ */
export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [rol, setRol] = useState("CLIENTE");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* --------- Reglas de contraseña (retro en vivo) --------- */
  const pwRules = useMemo(() => {
    const hasMin = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password); // 👈 carácter especial
    return { hasMin, hasUpper, hasLower, hasNumber, hasSpecial };
  }, [password]);

  const passwordsMatch = useMemo(
    () => password2.length > 0 && password2 === password,
    [password, password2]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const nombreT = nombre.trim();
    const emailT = email.trim();

    if (!nombreT || !emailT) {
      setErrorMsg("Completa nombre y correo.");
      return;
    }
    if (password !== password2) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    // 👇 validación extra para que coincida con los requisitos mostrados
    if (
      !pwRules.hasUpper ||
      !pwRules.hasLower ||
      !pwRules.hasNumber ||
      !pwRules.hasSpecial
    ) {
      setErrorMsg(
        "La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial."
      );
      return;
    }

    setLoading(true);
    try {
      const data = await api("/auth/register", {
        body: {
          nombre: nombreT,
          email: emailT,
          password,
          rol: rol || "CLIENTE",
        },
      });

      if (data?.details && typeof data.details === "object") {
        const joined = Object.entries(data.details)
          .map(([campo, msg]) => `${campo}: ${msg}`)
          .join(" • ");
        throw new Error(joined || data.error || "Error en registro");
      }

      alert(
        "Registro exitoso. Ingresa el código enviado a tu correo para activar tu cuenta."
      );
      window.location.href = `/verificar-correo?email=${encodeURIComponent(
        emailT
      )}`;
    } catch (err) {
      console.error("Error en registro:", err);
      setErrorMsg(err.message || "Error en registro");
      alert(`Error en registro: ${err.message || "desconocido"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <section className="min-h-[80vh] grid lg:grid-cols-2 bg-white">
        {/* Lado izquierdo - Formulario */}
        <div className="flex items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-[#FFF9E6] to-[#FFFDEF]">
          <div className="max-w-md w-full space-y-8">
            {/* Encabezado */}
            <div className="text-center lg:text-left space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Sparkles className="text-[#FFD54F]" size={24} />
                <span className="text-[#EC5DBB] font-semibold text-sm uppercase tracking-wide">
                  Únete a nuestra comunidad
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-[#1C1C1C] leading-tight">
                Crea tu <span className="text-[#4A90E2]">cuenta</span>
              </h1>
              <p className="text-lg text-[#333333] font-medium">
                Regístrate y descubre un mundo de creatividad y color
              </p>
            </div>

            {/* Error global */}
            {errorMsg && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Formulario */}
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-5">
                <Input
                  label="Nombre completo"
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {/* Contraseña */}
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Checklist de requisitos */}
                {password.length > 0 && (
                  <ul className="ml-1 space-y-1 text-sm">
                    <li
                      className={`flex items-center gap-2 ${
                        pwRules.hasMin ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {pwRules.hasMin ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Mínimo 8 caracteres
                    </li>
                    <li
                      className={`flex items-center gap-2 ${
                        pwRules.hasUpper ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {pwRules.hasUpper ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Una letra mayúscula
                    </li>
                    <li
                      className={`flex items-center gap-2 ${
                        pwRules.hasLower ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {pwRules.hasLower ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Una letra minúscula
                    </li>
                    <li
                      className={`flex items-center gap-2 ${
                        pwRules.hasNumber ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {pwRules.hasNumber ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Un número
                    </li>
                    <li
                      className={`flex items-center gap-2 ${
                        pwRules.hasSpecial
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {pwRules.hasSpecial ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Un carácter especial (por ejemplo ! @ # $ %)
                    </li>
                  </ul>
                )}

                {/* Confirmar contraseña */}
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                />
                {password2.length > 0 && password !== password2 && (
                  <p className="text-sm text-red-600 -mt-2">
                    Las contraseñas no coinciden.
                  </p>
                )}

                {/* Rol visual */}
                <RoleSelector value={rol} onChange={setRol} />
              </div>

              <label className="flex items-start gap-3 text-sm text-[#333333] cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-lg border-2 border-[#E0E0E0] appearance-none checked:bg-[#4A90E2] checked:border-[#4A90E2] transition-colors group-hover:border-[#4A90E2]"
                    required
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-0 checked:opacity-100 pointer-events-none">
                    ✓
                  </div>
                </div>
                <span>
                  Acepto los{" "}
                  <a
                    href="#"
                    className="text-[#4A90E2] font-semibold hover:underline"
                  >
                    términos y condiciones
                  </a>{" "}
                  y la{" "}
                  <a
                    href="#"
                    className="text-[#4A90E2] font-semibold hover:underline"
                  >
                    política de privacidad
                  </a>
                </span>
              </label>

              <div className="space-y-4">
                <PrimaryButton
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-bold
             transition-all duration-200
             hover:-translate-y-0.5 hover:shadow-lg
             focus:outline-none focus:ring-4 focus:ring-[#FFD54F]/40
             active:translate-y-0 active:scale-[0.98]"
                >
                  <UserPlus size={20} />
                  {loading ? "Creando cuenta..." : "Crear mi cuenta"}
                </PrimaryButton>

                <SecondaryButton
                  type="button"
                  onClick={() => window.history.back()}
                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-bold
                      transition-all duration-200 border-2
                      hover:bg-[#EAF3FF] hover:border-[#4A90E2] hover:text-[#1C1C1C]
                      focus:outline-none focus:ring-4 focus:ring-[#4A90E2]/30
                      active:scale-[0.98]"
                >
                  <ArrowLeft size={20} />
                  Volver al inicio
                </SecondaryButton>
              </div>
            </form>

            {/* Enlace login */}
            <div className="text-center pt-4">
              <p className="text-[#666666]">
                ¿Ya tienes cuenta?
                <a
                  href="/login"
                  className="text-[#4A90E2] font-semibold hover:underline ml-1"
                >
                  Inicia sesión aquí
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Lado derecho - Beneficios */}
        <div className="hidden lg:flex items-center justify-center p-12 bg-gradient-to-br from-[#2DC5A1] to-[#24A085] relative overflow-hidden">
          <div className="absolute top-10 right-10 w-24 h-24 bg-[#FFD54F]/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-20 h-20 bg-[#4A90E2]/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#EC5DBB]/20 rounded-full blur-lg"></div>

          <div className="relative z-10 max-w-md w-full space-y-8 text-center text-white">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="h-28 w-28 rounded-3xl bg-white/20 backdrop-blur-sm grid place-items-center border-2 border-white/30 shadow-lg">
                  <Package size={44} color="white" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-5xl font-bold">La Pape</h2>
                <p className="text-xl opacity-95 font-medium">
                  Tu viaje creativo comienza aquí
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-5 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/25 shadow-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Gift size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-lg">10% de descuento</h4>
                  <p className="text-sm opacity-90">
                    En tu primera compra al registrarte
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-5 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/25 shadow-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-lg">Acceso exclusivo</h4>
                  <p className="text-sm opacity-90">
                    A promociones y productos nuevos
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-5 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/25 shadow-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-lg">Compra más rápido</h4>
                  <p className="text-sm opacity-90">
                    Guarda tus datos para futuras compras
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/25 shadow-sm">
              <div className="flex items-center gap-1 justify-center mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} className="fill-white text-white" />
                ))}
              </div>
              <p className="text-base italic opacity-95 mb-3 leading-relaxed">
                &quot;Desde que me registré, recibo ofertas exclusivas y mi proceso de compra
                es mucho más rápido. ¡Totalmente recomendado!&quot;
              </p>
              <p className="text-sm opacity-90 font-medium">
                — Carlos M., Miembro desde 2023
              </p>
            </div>
          </div>
        </div>

        {/* Versión móvil panel derecho */}
        <div className="lg:hidden bg-gradient-to-r from-[#2DC5A1] to-[#24A085] p-8">
          <div className="text-center text-white space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-white/20 grid place-items-center border border-white/30">
                <Package size={32} color="white" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-bold">La Pape</h3>
              <p className="opacity-95 font-medium">Tu viaje creativo comienza aquí</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Gift size={18} className="text-white" />
                </div>
                <p className="text-xs font-medium opacity-90">10% OFF</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Star size={18} className="text-white" />
                </div>
                <p className="text-xs font-medium opacity-90">Exclusivo</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield size={18} className="text-white" />
                </div>
                <p className="text-xs font-medium opacity-90">Más rápido</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

