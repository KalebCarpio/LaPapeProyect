"use client";
import RoleLayout from "@/components/RoleLayout";

export default function DuenoHome() {
  return (
    <RoleLayout role="DUENO">
      <h1 className="text-2xl font-bold mb-4">Panel de Dueño</h1>
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Ventas" desc="Resumen y reportes" />
        <Card title="Usuarios" desc="Roles y permisos" />
        <Card title="Config. de la tienda" desc="Sucursales, catálogos" />
      </section>
    </RoleLayout>
  );
}

function Card({ title, desc }) {
  return (
    <div className="rounded-2xl bg-white border border-black/10 p-4 shadow-sm hover:shadow-md transition-all">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-black/60">{desc}</p>
    </div>
  );
}
