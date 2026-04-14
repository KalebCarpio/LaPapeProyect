import RoleLayout from "@/components/RoleLayout";

export default function UsuariosPage() {
  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Usuarios"
      subtitle="Consulta y administra los accesos internos del sistema desde una seccion dedicada de seguridad."
    >
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#F3E3A2] bg-white p-8 shadow-[0_20px_45px_rgba(245,158,11,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
          Seguridad interna
        </p>
        <h2 className="mt-3 text-3xl font-bold text-[#1F2933]">Gestion de usuarios</h2>
        <p className="mt-3 text-sm leading-6 text-[#4B5563]">
          El dashboard ya contempla este modulo en la navegacion lateral para que puedas
          incorporarlo despues sin volver a rediseñar la experiencia.
        </p>
      </section>
    </RoleLayout>
  );
}
