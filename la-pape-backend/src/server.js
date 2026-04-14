// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB, sequelize } from "./db.js";
import { connectPrisma, disconnectPrisma } from "./lib/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import posRoutes from "./routes/pos.routes.js";
import forecastRoutes from "./routes/forecast.routes.js";
import adminRoutes from "./routes/admin.routes.js";

// ✅ Importa modelos para que sequelize.sync() los cree
import "./models/User.js";

// ✅ Para probar envío directo
import { sendMail, templates } from "./services/email.service.js";

const app = express();

/* ------------------------------------------------------------------ */
/* Config básica                                                       */
/* ------------------------------------------------------------------ */
app.set("trust proxy", 1);

const originsEnv = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || "";
const allowedOrigins = originsEnv
  ? originsEnv.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalized = origin.endsWith("/") ? origin.slice(0, -1) : origin;

    if (allowedOrigins.includes(normalized)) return callback(null, true);

    callback(new Error(`CORS: origen no permitido -> ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ------------------------------------------------------------------ */
/* Seguridad y rendimiento                                            */
/* ------------------------------------------------------------------ */
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Demasiadas peticiones, intenta más tarde.",
  })
);

/* ------------------------------------------------------------------ */
/* Parsers                                                            */
/* ------------------------------------------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------------------------------------------------ */
/* IAST                                                               */
/* ------------------------------------------------------------------ */
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[IAST] ${req.method} ${req.originalUrl} status=${res.statusCode} ip=${req.ip} time=${ms}ms`
    );
  });

  next();
});

/* ------------------------------------------------------------------ */
/* Rutas                                                              */
/* ------------------------------------------------------------------ */
app.get("/", (_req, res) => {
  res.json({ ok: true, name: "La Pape API (PostgreSQL)" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* ------------------------------------------------------------------ */
/* ✅ TEST: envío de correo directo (sin register/login)               */
/* ------------------------------------------------------------------ */
app.get("/test-email", async (_req, res) => {
  try {
    const to = process.env.TEST_EMAIL_TO || process.env.MAIL_FROM_EMAIL;

    if (!to) {
      return res.status(400).json({
        ok: false,
        error: "No hay correo destino. Define TEST_EMAIL_TO o MAIL_FROM_EMAIL en .env",
      });
    }

    await sendMail({
      to,
      subject: "Prueba Brevo La Pape",
      html: templates.otp("123456", "Prueba de envío"),
      devLog: "TEST EMAIL",
    });

    return res.json({ ok: true, message: `Correo de prueba enviado a ${to}` });
  } catch (err) {
    console.error("❌ test-email falló:", err?.message || err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "falló el envío",
    });
  }
});

// ✅ Montaje de rutas principales
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/offers", offerRoutes);
app.use("/branches", branchRoutes);
app.use("/pos", posRoutes);
app.use("/sales", saleRoutes);
app.use("/forecast", forecastRoutes);
app.use("/admin", adminRoutes);

/* ------------------------------------------------------------------ */
/* 404 & errores                                                      */
/* ------------------------------------------------------------------ */
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, _req, res, _next) => {
  console.error("🔥 Error handler:", err);
  const status = Number.isInteger(err.status || err.code)
    ? err.status || err.code
    : 500;

  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});

/* ------------------------------------------------------------------ */
/* Arranque                                                           */
/* ------------------------------------------------------------------ */
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    console.log(`🧭 Node version: ${process.version}`);

    // ✅ Logs para confirmar que el .env se está leyendo bien
    console.log("BREVO_API_KEY existe?:", Boolean(process.env.BREVO_API_KEY));
    console.log("MAIL_FROM_EMAIL:", process.env.MAIL_FROM_EMAIL);
    console.log("FRONTEND_ORIGIN(S):", process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN);

    await connectDB();
    await sequelize.sync();
    console.log("✅ Tablas Sequelize sincronizadas");
    await connectPrisma();

    const server = app.listen(PORT, () => {
      console.log(`🚀 API escuchando en puerto ${PORT}`);
    });

    const shutdown = async () => {
      await disconnectPrisma().catch(() => undefined);
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    const keepAliveUrl = process.env.KEEP_ALIVE_URL;

    if (keepAliveUrl) {
      if (typeof fetch === "undefined") {
        console.warn(
          "⚠️ Keep-alive desactivado: 'fetch' no está disponible en esta versión de Node."
        );
        return;
      }

      const minutes = Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES || 14);
      const intervalMs = Math.max(1, minutes) * 60 * 1000;

      console.log(
        `🕑 Keep-alive activado: ping cada ${intervalMs / 60000} min a ${keepAliveUrl}`
      );

      const ping = () =>
        fetch(keepAliveUrl, { cache: "no-store" })
          .then((res) => {
            if (!res.ok) {
              console.error(`Keep-alive: respuesta no OK (${res.status})`);
            }
          })
          .catch((err) => {
            console.error(`Keep-alive falló: ${err.message}`);
          });

      ping();
      const timer = setInterval(ping, intervalMs);
      server.on("close", () => clearInterval(timer));
    }
  } catch (err) {
    console.error("❌ Error arrancando el servidor:", err);
    process.exit(1);
  }
})();
