"use client";

import Header from "@/components/Header";
import AdminShell from "@/components/AdminShell";
import { useAuth } from "@/components/AuthProvider";

export default function PlaceholderPage({ title, description }) {
  const { user } = useAuth();
  const role = String(user?.rol || user?.role || "").toUpperCase();

  if (role === "DUENO") {
    return (
      <AdminShell title={title} subtitle={description}>
        <section className="mx-auto max-w-3xl rounded-3xl border border-[#F3E3A2] bg-white p-8 shadow-[0_20px_45px_rgba(245,158,11,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
            Modulo listo para continuar
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#1F2933]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#4B5563]">{description}</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFF9E6] to-white px-4 py-12">
        <section className="mx-auto max-w-3xl rounded-3xl border border-[#F3E3A2] bg-white p-8 shadow-[0_20px_45px_rgba(245,158,11,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
            Modulo listo para continuar
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#1F2933]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#4B5563]">{description}</p>
        </section>
      </main>
    </>
  );
}
