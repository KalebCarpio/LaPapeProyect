// pry_lapape/src/app/400/page.js
import Link from "next/link";

export default function BadRequestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-yellow-50 flex items-center justify-center text-2xl">
          🧩
        </div>

        <h1 className="text-3xl font-bold text-gray-900">400</h1>
        <p className="mt-2 text-gray-600">
          La solicitud no es válida o faltan datos. Verifica la URL o vuelve a intentarlo.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Volver al inicio
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
          >
            Ir a login
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Error 400 • La Pape
        </p>
      </section>
    </main>
  );
}
