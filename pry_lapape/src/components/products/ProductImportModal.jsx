"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileUp, UploadCloud } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { CommercialModalShell } from "@/components/commercial/CommercialUI";

function ReferenceSheet() {
  const columns = [
    "nombre",
    "codigo_producto",
    "descripcion",
    "categoria",
    "marca",
    "precio",
    "stock",
    "imagen_url",
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-[#D7E7FF] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#EEF2F7] bg-[#F8FBFF] px-4 py-3">
        <p className="text-sm font-semibold text-[#1F2933]">Referencia visual</p>
        <p className="mt-1 text-xs text-[#6B7280]">
          La plantilla oficial solo lleva encabezados. Esta vista muestra cómo debe verse la primera fila.
        </p>
      </div>
      <div className="overflow-x-auto px-4 py-4">
        <div className="min-w-[720px] rounded-2xl border border-[#E5E7EB]">
          <div className="grid grid-cols-8 bg-[#FFF9E6] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8B95A7]">
            {columns.map((column) => (
              <div key={column} className="border-r border-[#F2E8BF] px-3 py-2 last:border-r-0">
                {column}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 bg-white text-[11px] text-[#C0C7D1]">
            {columns.map((column) => (
              <div key={column} className="border-r border-[#F3F4F6] px-3 py-3 last:border-r-0">
                ...
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductImportModal({
  open,
  importing,
  selectedFile,
  onClose,
  onSelectFile,
  onImport,
  onDownloadTemplate,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const fileLabel = useMemo(() => {
    if (!selectedFile) return "Aún no has seleccionado ningún archivo.";
    return `${selectedFile.name} · ${(selectedFile.size / 1024).toFixed(1)} KB`;
  }, [selectedFile]);

  if (!open) return null;

  const pickFile = () => inputRef.current?.click();

  const handleFile = (file) => {
    if (!file) return;
    onSelectFile(file);
  };

  return (
    <CommercialModalShell
      eyebrow="Inventario"
      title="Importar inventario desde CSV"
      subtitle="Usa la plantilla oficial, arrastra tu archivo y valida la estructura antes de cargarlo."
      maxWidthClassName="max-w-6xl"
      onClose={onClose}
    >
        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-5">
            <div
              role="button"
              tabIndex={0}
              onClick={pickFile}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  pickFile();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className={`rounded-[32px] border-2 border-dashed p-8 text-center transition ${
                dragging
                  ? "border-[#4A90E2] bg-[#EEF5FF]"
                  : "border-[#D7E7FF] bg-[#F8FBFF] hover:border-[#4A90E2] hover:bg-[#F3F8FF]"
              }`}
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#1D6FD1] shadow-sm">
                <UploadCloud size={28} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#1F2933]">Arrastra aquí tu archivo CSV</h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                También puedes hacer clic para seleccionar un archivo desde tu equipo.
              </p>
              <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#1F2933]">
                {fileLabel}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <SecondaryButton type="button" onClick={pickFile}>
                  <FileUp size={16} />
                  Seleccionar archivo
                </SecondaryButton>
                <SecondaryButton type="button" onClick={onDownloadTemplate}>
                  <Download size={16} />
                  Descargar plantilla oficial
                </SecondaryButton>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </div>

            <div className="rounded-3xl border border-[#FFE9A8] bg-[#FFF8DB] p-5">
              <p className="font-semibold text-[#8A5C00]">Plantilla oficial requerida</p>
              <p className="mt-2 text-sm leading-6 text-[#9A6700]">
                El sistema solo acepta archivos cuya primera fila sea exactamente:
              </p>
              <p className="mt-3 rounded-2xl bg-white px-4 py-3 font-mono text-xs text-[#1D6FD1]">
                nombre,codigo_producto,descripcion,categoria,marca,precio,stock,imagen_url
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <ReferenceSheet />

            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold text-[#1F2933]">Recomendaciones rápidas</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#6B7280]">
                <li>Usa la plantilla oficial descargada desde este módulo.</li>
                <li>No agregues columnas técnicas, IDs o campos extra al encabezado principal.</li>
                <li>Si quieres dejar un producto sin imagen, puedes dejar vacía la columna `imagen_url`.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton type="button" onClick={onClose}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton type="button" onClick={onImport} disabled={!selectedFile || importing}>
                <FileUp size={16} />
                {importing ? "Importando..." : "Importar archivo"}
              </PrimaryButton>
            </div>
          </div>
        </div>
    </CommercialModalShell>
  );
}
