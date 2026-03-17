// pry_lapape/src/app/error.js
"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Puedes dejar esto para debug en desarrollo:
    console.error("Global error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">
          ⚠️
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Ocurrió un error inesperado
        </h1>
        <p className="mt-2 text-gray-600">
          Hubo un problema al cargar esta sección. Puedes intentar de nuevo.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold bg-red-600 text-white hover:bg-red-700 transition"
          >
            Reintentar
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Error 500 • La Pape
        </p>
      </section>
    </main>
  );
}
