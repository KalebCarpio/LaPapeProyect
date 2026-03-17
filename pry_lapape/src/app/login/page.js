"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { LogIn, UserPlus, Package, Sparkles, Shield, Truck, Star } from "lucide-react";
import { api, decodeJWT } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { GoogleLogin } from "@react-oauth/google"; // 👈 NUEVO

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();

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
    const emailTrimmed = email.trim();

    if (!emailTrimmed || !password) {
      alert("Ingresa tu correo y contraseña.");
      return;
    }
    try {
      setLoading(true);
      const res = await api("/auth/login", { body: { email: emailTrimmed, password } });

      // 1) Si falta verificar el correo
      if (res.needEmailVerify) {
        alert("Verifica tu correo para continuar.");
        router.push(`/verificar-correo?email=${encodeURIComponent(emailTrimmed)}`);
        return;
      }

      if (res.stage === "secret-question") {
        try {
          sessionStorage.setItem(
            "pending-secret-question",
            JSON.stringify({
              email: emailTrimmed,
              remember,
              question: res.secretQuestion || "",
              user: res.user || null,
            })
          );
        } catch (storageErr) {
          console.warn("No se pudo guardar el estado para la pregunta secreta", storageErr);
        }
        router.push(`/verificar-pregunta?email=${encodeURIComponent(emailTrimmed)}`);
        return;
      }

      // 2) Si requiere OTP (2FA por correo)
      if (res.needOtp || res.stage === "2fa") {
        try {
          sessionStorage.setItem(
            "pending-2fa",
            JSON.stringify({ email: emailTrimmed, remember, user: res.user || null })
          );
        } catch (storageErr) {
          console.warn("No se pudo guardar el estado para 2FA", storageErr);
        }
        router.push(`/verificar-2fa?email=${encodeURIComponent(emailTrimmed)}`);
        return;
      }

      // 3) Login completo con token
      if (res.token) {
        const user = normalizeUser(res.user, emailTrimmed, res.token);
        authLogin({ user, token: res.token, remember });
        try {
          sessionStorage.removeItem("pending-2fa");
          sessionStorage.removeItem("pending-secret-question");
        } catch (storageErr) {
          console.warn("No se pudo limpiar el estado de autenticación en dos pasos", storageErr);
        }
        goToDashboard(user.role || user.rol);
        return;
      }

      // Si no llega nada reconocible
      alert("Respuesta inesperada del servidor.");
    } catch (err) {
      if (err?.data?.needEmailVerify || err?.message?.toLowerCase?.().includes("verifica")) {
        alert(err.message || "Verifica tu correo antes de continuar");
        router.push(`/verificar-correo?email=${encodeURIComponent(emailTrimmed)}`);
        return;
      }
      alert(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  // 👇 NUEVO: handlers para Google
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const idToken = credentialResponse?.credential;

      if (!idToken) {
        alert("No se recibió el token de Google. Intenta de nuevo.");
        return;
      }

      const res = await api("/auth/login/google", {
        body: { idToken },
      });

      if (res?.token) {
        // usamos el email del backend si viene, si no, el que esté en el JWT
        const fallbackEmail = res.user?.email || "";
        const user = normalizeUser(res.user, fallbackEmail, res.token);

        // con Google lo guardamos como 'remember: true' para que se quede la sesión
        authLogin({ user, token: res.token, remember: true });

        try {
          sessionStorage.removeItem("pending-2fa");
          sessionStorage.removeItem("pending-secret-question");
        } catch (storageErr) {
          console.warn("No se pudo limpiar el estado de autenticación en dos pasos", storageErr);
        }

        goToDashboard(user.role || user.rol);
      } else {
        alert("No se pudo iniciar sesión con Google.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    alert("No se pudo completar el inicio de sesión con Google.");
  };

  return (
    <>
      <Header />
      <section className="min-h-[80vh] grid lg:grid-cols-2 bg-white">
        {/* Lado izquierdo - Formulario de login */}
        <div className="flex items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-[#FFF9E6] to-[#FFFDEF]">
          <div className="max-w-md w-full space-y-8">
            {/* Encabezado */}
            <div className="text-center lg:text-left space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Sparkles className="text-[#FFD54F]" size={24} />
                <span className="text-[#EC5DBB] font-semibold text-sm uppercase tracking-wide">
                  Bienvenido de vuelta
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-[#1C1C1C] leading-tight">
                Inicia <span className="text-[#4A90E2]">sesión</span>
              </h1>

              <p className="text-lg text-[#333333] font-medium">
                Accede a tu cuenta para gestionar pedidos y promociones exclusivas
              </p>
            </div>

            {/* Formulario */}
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-5">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Opciones adicionales */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-sm text-[#333333] cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-5 w-5 rounded-lg border-2 border-[#E0E0E0] appearance-none checked:bg-[#4A90E2] checked:border-[#4A90E2] transition-colors group-hover:border-[#4A90E2]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-0 checked:opacity-100 pointer-events-none">
                      ✓
                    </div>
                  </div>
                  Recuérdame
                </label>
                <a
                  href="/olvide-password"
                  className="text-sm text-[#4A90E2] font-semibold hover:text-[#2D7BE0] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botones */}
              <div className="space-y-4">
                <PrimaryButton
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-bold"
                >
                  <LogIn size={20} />
                  {loading ? "Entrando..." : "Entrar a mi cuenta"}
                </PrimaryButton>

                <SecondaryButton
                  type="button"
                  onClick={() => router.push("/registro")}
                  className="w-full flex items-center justify-center gap-3 py-4 text-lg font-bold"
                >
                  <UserPlus size={20} />
                  Crear cuenta nueva
                </SecondaryButton>
              </div>
            </form>

            {/* Separador */}
            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t border-[#E0E0E0]"></div>
              <span className="flex-shrink mx-4 text-sm text-[#666666] font-medium">
                o continúa con
              </span>
              <div className="flex-grow border-t border-[#E0E0E0]"></div>
            </div>

            {/* Login con Google real */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
              />
            </div>
          </div>
        </div>

        {/* Lado derecho - Información de la marca */}
        <div className="hidden lg:flex items-center justify-center p-12 bg-gradient-to-br from-[#4A90E2] to-[#2D7BE0] relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute top-10 right-10 w-24 h-24 bg-[#FFD54F]/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-20 h-20 bg-[#EC5DBB]/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#2DC5A1]/20 rounded-full blur-lg"></div>

          <div className="relative z-10 max-w-md w-full space-y-8 text-center text-white">
            {/* Logo y nombre */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="h-28 w-28 rounded-3xl bg-white/20 backdrop-blur-sm grid place-items-center border-2 border-white/30 shadow-lg">
                  <Package size={44} color="white" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-5xl font-bold">La Pape</h2>
                <p className="text-xl opacity-95 font-medium">
                  Tu papelería creativa con inspiración y color
                </p>
              </div>
            </div>

            {/* Beneficios */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-5 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/25 shadow-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Truck size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-lg">Envío gratis</h4>
                  <p className="text-sm opacity-90">En compras mayores a $500</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-5 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/25 shadow-sm">
                <div className="w-12 h-12 bg.white/20 rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-lg">Compra segura</h4>
                  <p className="text-sm opacity-90">Datos 100% protegidos</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-5 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/25 shadow-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-lg">Clientes felices</h4>
                  <p className="text-sm opacity-90">+5,000 reseñas positivas</p>
                </div>
              </div>
            </div>

            {/* Testimonio */}
            <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 justify-center mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className="fill-white text-white" />
                ))}
              </div>
              <p className="text-sm italic opacity-90 mb-3">
                &quot;La mejor papelería online, productos de calidad y entrega súper rápida.&quot;
              </p>
              <p className="text-xs opacity-75">- Ana G., Cliente frecuente</p>
            </div>
          </div>
        </div>

        {/* Versión móvil del panel derecho */}
        <div className="lg:hidden bg-gradient-to-r from-[#4A90E2] to-[#2D7BE0] p-8">
          <div className="text-center text-white space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-white/20 grid place-items-center border border-white/30">
                <Package size={32} color="white" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-bold">La Pape</h3>
              <p className="opacity-95 font-medium">Tu papelería creativa</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Truck size={18} className="text-white" />
                </div>
                <p className="text-xs font-medium opacity-90">Envío gratis</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield size={18} className="text-white" />
                </div>
                <p className="text-xs font-medium opacity-90">Compra segura</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Star size={18} className="text-white" />
                </div>
                <p className="text-xs font-medium opacity-90">5 estrellas</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

