import RoleLayout from "@/components/RoleLayout";

export default function RolesPage() {
  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Roles"
      subtitle="Centraliza los permisos y la estructura de acceso dentro del bloque de seguridad del panel."
    >
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#F3E3A2] bg-white p-8 shadow-[0_20px_45px_rgba(245,158,11,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
          Gobierno del sistema
        </p>
        <h2 className="mt-3 text-3xl font-bold text-[#1F2933]">Configuracion de roles</h2>
        <p className="mt-3 text-sm leading-6 text-[#4B5563]">
          Esta vista deja preparado el espacio de roles para crecer junto con el panel
          administrativo sin tocar ningun servicio del backend.
        </p>
      </section>
    </RoleLayout>
  );
}
