// src/controllers/auth.controller.js
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendMail, templates } from "../services/email.service.js";
import {
  random6,
  hashToken,
  hashOtpToken,
  compareToken,
  expMinutes,
  signAccessToken,
} from "../services/token.service.js";
import {
  isEmail,
  isStrongPassword,
  isValidRole,
  normalizeEmail,
} from "../utils/validators.js";
import { OAuth2Client } from "google-auth-library";

const rawMinutes = Number.parseInt(process.env.JWT_EXPIRES_MINUTES || "", 10);
const SESSION_MINUTES =
  Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : 120;
const JWT_EXPIRES_IN = `${SESSION_MINUTES}m`;
const LOGIN_METHODS = ["PASSWORD_ONLY", "PASSWORD_2FA", "PASSWORD_SECRET"];

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Límites de seguridad
const MAX_FAILED_LOGIN_ATTEMPTS = 3;
const LOGIN_LOCK_MINUTES = 15;

const MAX_RESET_REQUESTS = 3;
const RESET_WINDOW_MINUTES = 15;
const RESET_BLOCK_MINUTES = 30;

function resolveLoginMethod(user) {
  if (LOGIN_METHODS.includes(user.loginMethod)) return user.loginMethod;
  if (user.twoFAEnabled) return "PASSWORD_2FA";
  return "PASSWORD_ONLY";
}

function toPublicUser(user) {
  const role = (user.rol || user.role || "CLIENTE").toString().toUpperCase();

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: role,
    role,
    isVerified: user.isVerified,
    twoFAEnabled: user.twoFAEnabled,
    loginMethod: resolveLoginMethod(user),
    secretQuestion: user.secretQuestion,
    hasSecretQuestion: Boolean(user.secretQuestion && user.secretAnswerHash),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    provider: user.provider || "LOCAL",
    avatarUrl: user.avatarUrl || null,
  };
}

async function finalizeLogin(user, req) {
  const now = new Date();

  user.clearExpiredSessions(now);

  const token = signAccessToken(user, { expiresIn: JWT_EXPIRES_IN });
  const expiresAt = expMinutes(SESSION_MINUTES);
  const tokenHash = await hashToken(token);

  const sessions = Array.isArray(user.sessions) ? [...user.sessions] : [];

  const session = {
    tokenHash,
    expiresAt,
    userAgent: req.get("user-agent") || "unknown",
    ipAddress: req.ip,
    createdAt: now,
  };

  sessions.push(session);

  user.sessions = sessions;
  user.lastLoginAt = now;

  await user.save();

  return {
    token,
    expiresAt,
    expiresInSeconds: Math.round((expiresAt.getTime() - now.getTime()) / 1000),
  };
}

export async function register(req, res, next) {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || typeof nombre !== "string") {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ error: "Correo inválido" });
    }

    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({ error: "La contraseña no cumple los requisitos de seguridad" });
    }

    if (rol && !isValidRole(rol)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    const normalizedEmail = normalizeEmail(email);

    const exists = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (exists) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = random6();
    const verifyCode = await hashOtpToken(code);
    const verifyCodeExpires = expMinutes(15);

    const user = await User.create({
      nombre: nombre.trim(),
      email: normalizedEmail,
      passwordHash,
      rol: rol ? rol.toUpperCase() : "CLIENTE",
      verifyCode,
      verifyCodeExpires,
      twoFAEnabled: true,
      loginMethod: "PASSWORD_2FA",
    });

   try {
  await sendMail({
    to: normalizedEmail,
    subject: "Verifica tu cuenta | La Pape",
    html: templates.otp(code, "Código de verificación de correo"),
    devLog: `TOKEN VERIFICACIÓN: ${code}`,
  });
} catch (error) {
  console.warn("⚠️ No se pudo enviar el correo de verificación.");
  console.warn(`👉 Código de verificación para ${normalizedEmail}: ${code}`);
}

    return res.status(201).json({
      ok: true,
      message: "Registro exitoso. Revisa tu correo para validar la cuenta.",
      user: toPublicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const trimmedCode =
      typeof code === "string" ? code.trim() : String(code || "").trim();

    if (!isEmail(email) || !trimmedCode) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user || !user.verifyCode || !user.verifyCodeExpires) {
      return res.status(400).json({ error: "Código inválido" });
    }

    if (new Date() > new Date(user.verifyCodeExpires)) {
      return res.status(400).json({ error: "El código ha expirado" });
    }

    const valid = await compareToken(trimmedCode, user.verifyCode);
    if (!valid) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    user.isVerified = true;
    user.verifyCode = null;
    user.verifyCodeExpires = null;

    await user.save();

    await sendMail({
      to: user.email,
      subject: "Cuenta verificada | La Pape",
      html: templates.accountVerified(user.nombre),
    }).catch(() => undefined);

    return res.json({ ok: true, message: "Correo verificado correctamente" });
  } catch (err) {
    return next(err);
  }
}

export async function loginStep1(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isEmail(email) || !password) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const user = await User.findOne({
      where: { email: normalizeEmail(email) },
    });

    if (!user) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const now = new Date();

    if (user.lockUntil && new Date(user.lockUntil) > now) {
      const minutesLeft = Math.ceil((new Date(user.lockUntil) - now) / 60000);
      return res.status(423).json({
        error:
          "Cuenta bloqueada por intentos fallidos. Intenta de nuevo más tarde.",
        locked: true,
        minutesLeft,
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(
          now.getTime() + LOGIN_LOCK_MINUTES * 60 * 1000
        );
        user.failedLoginAttempts = 0;
      }

      await user.save();
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    if (!user.isVerified) {
      await user.save();
      return res.status(403).json({
        error: "Verifica tu correo antes de continuar",
        needEmailVerify: true,
      });
    }

    const loginMethod = resolveLoginMethod(user);

    if (loginMethod === "PASSWORD_ONLY") {
      user.twoFAEnabled = false;
      const loginResult = await finalizeLogin(user, req);

      return res.json({
        ok: true,
        stage: "done",
        ...loginResult,
        user: toPublicUser(user),
      });
    }

    if (loginMethod === "PASSWORD_SECRET") {
      if (!user.secretQuestion || !user.secretAnswerHash) {
        await user.save();
        return res.status(400).json({
          error: "No hay pregunta secreta configurada para esta cuenta",
        });
      }

      await user.save();

      return res.json({
        ok: true,
        stage: "secret-question",
        email: user.email,
        secretQuestion: user.secretQuestion,
        user: toPublicUser(user),
      });
    }

    const code = random6();
    user.loginMethod = "PASSWORD_2FA";
    user.twoFAEnabled = true;
    user.twoFAHash = await hashOtpToken(code);
    user.twoFAExp = expMinutes(10);

    await user.save();

    await sendMail({
      to: user.email,
      subject: "Código de acceso (2FA) | La Pape",
      html: templates.otp(code, "Tu código de acceso (2FA)"),
      devLog: `CÓDIGO 2FA: ${code}`,
    });

    return res.json({
      ok: true,
      stage: "2fa",
      needOtp: true,
      email: user.email,
      user: toPublicUser(user),
      message: "Hemos enviado un código a tu correo",
    });
  } catch (err) {
    return next(err);
  }
}

export async function loginStep2(req, res, next) {
  try {
    const { email, code } = req.body;

    const trimmedCode =
      typeof code === "string" ? code.trim() : String(code || "").trim();

    if (!isEmail(email) || !trimmedCode) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    const user = await User.findOne({
      where: { email: normalizeEmail(email) },
    });

    const loginMethod = user ? resolveLoginMethod(user) : null;

    if (!user || loginMethod !== "PASSWORD_2FA") {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    if (!user.twoFAHash || !user.twoFAExp) {
      return res.status(400).json({ error: "No hay un código activo" });
    }

    if (new Date() > new Date(user.twoFAExp)) {
      return res.status(400).json({ error: "El código 2FA ha expirado" });
    }

    const ok = await compareToken(trimmedCode, user.twoFAHash);
    if (!ok) {
      return res.status(400).json({ error: "Código 2FA incorrecto" });
    }

    user.twoFAHash = null;
    user.twoFAExp = null;

    const loginResult = await finalizeLogin(user, req);

    return res.json({
      ok: true,
      ...loginResult,
      user: toPublicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

export async function verifySecretQuestion(req, res, next) {
  try {
    const { email, answer } = req.body;
    const trimmedAnswer = typeof answer === "string" ? answer.trim() : "";

    if (!isEmail(email) || !trimmedAnswer) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    const user = await User.findOne({
      where: { email: normalizeEmail(email) },
    });

    const loginMethod = user ? resolveLoginMethod(user) : null;

    if (!user || loginMethod !== "PASSWORD_SECRET") {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    if (!user.secretAnswerHash || !user.secretQuestion) {
      return res.status(400).json({ error: "No hay pregunta secreta activa" });
    }

    const ok = await bcrypt.compare(trimmedAnswer, user.secretAnswerHash);
    if (!ok) {
      return res.status(400).json({ error: "Respuesta incorrecta" });
    }

    const loginResult = await finalizeLogin(user, req);

    return res.json({
      ok: true,
      ...loginResult,
      user: toPublicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!isEmail(email)) {
      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código",
      });
    }

    const now = new Date();

    if (user.resetBlockedUntil && new Date(user.resetBlockedUntil) > now) {
      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código cuando sea posible.",
      });
    }

    if (
      user.resetLastAttemptAt &&
      now.getTime() - new Date(user.resetLastAttemptAt).getTime() >
        RESET_WINDOW_MINUTES * 60 * 1000
    ) {
      user.resetAttempts = 0;
    }

    user.resetAttempts = (user.resetAttempts || 0) + 1;
    user.resetLastAttemptAt = now;

    if (user.resetAttempts > MAX_RESET_REQUESTS) {
      user.resetBlockedUntil = new Date(
        now.getTime() + RESET_BLOCK_MINUTES * 60 * 1000
      );

      await user.save();

      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código cuando sea posible.",
      });
    }

    const code = random6();
    user.resetOTPHash = await hashOtpToken(code);
    user.resetOTPExp = expMinutes(10);
    user.resetBlockedUntil = null;

    await user.save();

    await sendMail({
      to: normalizedEmail,
      subject: "Código para recuperar contraseña | La Pape",
      html: templates.otp(code, "Recupera tu contraseña"),
      devLog: `CÓDIGO RESET: ${code}`,
    });

    return res.json({
      ok: true,
      message:
        "Si el correo existe, se envió un código (o se imprimió en consola)",
    });
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;

    if (!isEmail(email) || !code || !isStrongPassword(newPassword)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const user = await User.findOne({
      where: { email: normalizeEmail(email) },
    });

    if (!user || !user.resetOTPHash || !user.resetOTPExp) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    if (new Date() > new Date(user.resetOTPExp)) {
      return res.status(400).json({ error: "El código ha expirado" });
    }

    const ok = await compareToken(code, user.resetOTPHash);
    if (!ok) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    const now = new Date();

    if (
      !user.passwordChangesDate ||
      now.toDateString() !== new Date(user.passwordChangesDate).toDateString()
    ) {
      user.passwordChangesCount = 0;
      user.passwordChangesDate = now;
    }

    if ((user.passwordChangesCount || 0) >= 3) {
      return res.status(429).json({
        error:
          "Ya realizaste varios cambios de contraseña hoy. Inténtalo de nuevo más tarde.",
        tooManyPasswordChanges: true,
        limit: 3,
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetOTPHash = null;
    user.resetOTPExp = null;
    user.twoFAHash = null;
    user.twoFAExp = null;
    user.sessions = [];
    user.lastLoginAt = null;

    user.resetAttempts = 0;
    user.resetLastAttemptAt = null;
    user.resetBlockedUntil = null;

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    user.passwordChangesCount = (user.passwordChangesCount || 0) + 1;
    user.passwordChangesDate = now;

    await user.save();

    return res.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const user = req.user;
    const sessionIndex = req.auth?.sessionIndex;

    if (typeof sessionIndex !== "number" || sessionIndex < 0) {
      return res.status(400).json({ error: "No se pudo cerrar la sesión" });
    }

    const sessions = Array.isArray(user.sessions) ? [...user.sessions] : [];
    sessions.splice(sessionIndex, 1);
    user.sessions = sessions;

    await user.save();

    return res.json({ ok: true, message: "Sesión cerrada" });
  } catch (err) {
    return next(err);
  }
}

export async function loginWithGoogle(req, res, next) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        error: "El login con Google no está configurado en este entorno",
      });
    }

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Falta el token de Google" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Token de Google inválido" });
    }

    const email = normalizeEmail(payload.email);
    const nombre = payload.name || payload.given_name || email.split("@")[0];
    const googleId = payload.sub;
    const avatarUrl = payload.picture;

    let user = await User.findOne({
      where: { email },
    });

    if (!user) {
      const randomPassword = `${googleId}.${Date.now()}`;
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        nombre,
        email,
        passwordHash,
        rol: "CLIENTE",
        isVerified: true,
        provider: "GOOGLE",
        providerId: googleId,
        avatarUrl,
        twoFAEnabled: false,
        loginMethod: "PASSWORD_ONLY",
      });
    } else {
      if (!user.provider) user.provider = "LOCAL";
      if (!user.providerId) user.providerId = googleId;
      if (!user.isVerified && payload.email_verified) {
        user.isVerified = true;
      }
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
      }

      await user.save();
    }

    const loginResult = await finalizeLogin(user, req);

    return res.json({
      ok: true,
      ...loginResult,
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("Error en loginWithGoogle:", err);
    return next(err);
  }
}

export async function updateLoginMethod(req, res, next) {
  try {
    const method =
      typeof req.body?.method === "string"
        ? req.body.method.toUpperCase()
        : "";

    const question =
      typeof req.body?.question === "string"
        ? req.body.question.trim()
        : undefined;

    const answer =
      typeof req.body?.answer === "string"
        ? req.body.answer.trim()
        : undefined;

    if (!LOGIN_METHODS.includes(method)) {
      return res.status(400).json({ error: "Método de acceso inválido" });
    }

    const user = req.user;

    if (method === "PASSWORD_SECRET") {
      const finalQuestion = question ?? user.secretQuestion ?? "";

      if (!finalQuestion.trim()) {
        return res
          .status(400)
          .json({ error: "Debes definir la pregunta secreta" });
      }

      if (!answer && !user.secretAnswerHash) {
        return res
          .status(400)
          .json({ error: "Debes definir la respuesta secreta" });
      }

      user.secretQuestion = finalQuestion.trim();

      if (answer) {
        user.secretAnswerHash = await bcrypt.hash(answer, 10);
      }
    } else {
      if (question) {
        user.secretQuestion = question;
      }
      if (answer) {
        user.secretAnswerHash = await bcrypt.hash(answer, 10);
      }
    }

    user.loginMethod = method;
    user.twoFAEnabled = method === "PASSWORD_2FA";

    if (method !== "PASSWORD_2FA") {
      user.twoFAHash = null;
      user.twoFAExp = null;
    }

    await user.save();

    return res.json({
      ok: true,
      message: "Método de inicio de sesión actualizado",
      user: toPublicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

export function me(req, res) {
  return res.json({ ok: true, user: toPublicUser(req.user) });
}
