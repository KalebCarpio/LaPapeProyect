"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { productos } from "@/lib/mock";
import { Search, Grid3X3, List, SlidersHorizontal, Tags } from "lucide-react";
import { SecondaryButton, PrimaryButton } from "@/components/Buttons";
import Breadcrumbs from "@/components/Breadcrumbs";

//throw new Error("Prueba error 500");
// ✅ Mover esto FUERA del componente evita el warning de useMemo
const CATEGORY_KEYWORDS = {
  Escolares: [
    "cuaderno", "libreta", "lapiz", "lápiz", "pluma", "borrador", "regla",
    "mochila", "colores", "marcadores", "marcador", "sacapuntas"
  ],
  Oficina: [
    "carpeta", "archivero", "engrapadora", "grapas", "folder", "post-it",
    "papel", "impresora", "tinta", "clip", "clips", "cinta", "sobre"
  ],
  Arte: [
    "pintura", "acuarela", "lienzo", "pincel", "plumon", "plumón",
    "óleo", "gouache", "crayones", "carbon", "carbón", "marcadores"
  ],
  Papelería: [
    "papel", "cartulina", "libro", "sobre", "etiquetas", "agenda",
    "tarjeta", "hojas", "cuaderno", "libreta"
  ],
};

export default function CatalogoPage() {
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);

  // filtros avanzados
  const [sort, setSort] = useState("relevance"); // relevance | price_asc | price_desc
  const [onlyNovedades, setOnlyNovedades] = useState(false);

  const categorias = ["Todos", "Escolares", "Oficina", "Arte", "Papelería", "Novedades"];

  const filteredProducts = useMemo(() => {
    const s = search.trim().toLowerCase();

    let list = productos.filter((p) => {
      const titulo = (p.titulo || "").toLowerCase();

      // ✅ búsqueda simple
      const matchSearch = s ? titulo.includes(s) : true;

      // ✅ filtro por categoría (botones)
      let matchCategory = true;
      if (categoriaActiva === "Todos") {
        matchCategory = true;
      } else if (categoriaActiva === "Novedades") {
        matchCategory = Boolean(p.badge); // "novedades" si tiene badge
      } else {
        const keywords = CATEGORY_KEYWORDS[categoriaActiva] || [];
        matchCategory = keywords.length ? keywords.some((k) => titulo.includes(k)) : true;
      }

      // ✅ filtro avanzado: solo novedades
      const matchOnlyNovedades = onlyNovedades ? Boolean(p.badge) : true;

      return matchSearch && matchCategory && matchOnlyNovedades;
    });

    // ✅ ordenar
    if (sort === "price_asc") {
      list = [...list].sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
    } else if (sort === "price_desc") {
      list = [...list].sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
    }

    return list;
  }, [search, categoriaActiva, onlyNovedades, sort]);
        
  return (
    <>
      <Header />

      {/* Hero Section del Catálogo */}
      <section className="py-8 bg-gradient-to-br from-[#FFF9E6] to-[#FFFDEF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1C1C1C] mb-4">
              Nuestro <span className="text-[#4A90E2]">Catálogo</span>
            </h1>
            <p className="text-lg text-[#333333] max-w-2xl mx-auto">
              Descubre todo lo que necesitas para escuela, oficina y proyectos creativos.
              Calidad y color en cada producto.
            </p>
          </div>
          
          {/* Filtros rápidos por categoría */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setCategoriaActiva(categoria)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  categoriaActiva === categoria
                    ? "bg-[#FFD54F] text-[#1C1C1C] shadow-sm"
                    : "bg-white text-[#666666] border border-[#E0E0E0] hover:border-[#4A90E2] hover:text-[#4A90E2]"
                }`}
              >
                {categoria}
                {categoria === "Novedades" && (
                  <span className="ml-1 w-2 h-2 bg-[#EC5DBB] rounded-full inline-block"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido principal del catálogo */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Catálogo" },
            ]}
          />

          {/* Barra de herramientas */}
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1C1C1C]">Productos Destacados</h2>
                <p className="text-[#666666] text-sm mt-1">
                  Mostrando{" "}
                  <span className="text-[#4A90E2] font-semibold">{filteredProducts.length} productos</span>
                  {categoriaActiva !== "Todos" && (
                    <span className="ml-2 text-[#999999]">• {categoriaActiva}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#EC5DBB]/10 rounded-full border border-[#EC5DBB]/20">
                <Tags size={14} className="text-[#EC5DBB]" />
                <span className="text-[#EC5DBB] text-sm font-medium">15% OFF en escolares</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 lg:flex-initial">
                <div className="flex items-center gap-3 h-12 px-4 rounded-2xl border-2 border-[#E0E0E0] bg-white hover:border-[#4A90E2] transition-colors focus-within:border-[#4A90E2] focus-within:shadow-sm">
                  <Search size={18} className="text-[#666666]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="outline-none flex-1 text-[#1C1C1C] placeholder-[#999999]"
                    placeholder="Buscar productos..."
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <SecondaryButton
                  onClick={() => setShowFilters((v) => !v)}
                  className="flex items-center gap-2 px-4 py-3"
                  type="button"
                >
                  <SlidersHorizontal size={18} />
                  Filtros
                  <span className="w-2 h-2 bg-[#4A90E2] rounded-full"></span>
                </SecondaryButton>

                <div className="flex bg-[#F8F9FA] rounded-2xl p-1 border border-[#E0E0E0]">
                  <button className="p-2 rounded-xl bg-white text-[#1C1C1C] shadow-sm" type="button">
                    <Grid3X3 size={18} />
                  </button>
                  <button className="p-2 rounded-xl text-[#666666] hover:text-[#1C1C1C]" type="button">
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzados */}
          {showFilters && (
            <div className="mb-8 rounded-2xl border border-[#E0E0E0] bg-[#FFFDEF] p-5">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#1C1C1C]">Ordenar por</label>

                    {/* ✅ SELECT ARREGLADO (texto visible) */}
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="
                        appearance-none
                        rounded-xl border border-[#E0E0E0] bg-white px-4 py-2
                        text-[#1C1C1C] font-medium
                        focus:outline-none focus:border-[#4A90E2]
                      "
                      style={{ color: "#1C1C1C" }}
                    >
                      <option value="relevance" className="text-[#1C1C1C]">Relevancia</option>
                      <option value="price_asc" className="text-[#1C1C1C]">Precio: menor a mayor</option>
                      <option value="price_desc" className="text-[#1C1C1C]">Precio: mayor a menor</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 mt-6 sm:mt-0">
                    <input
                      id="onlyNovedades"
                      type="checkbox"
                      checked={onlyNovedades}
                      onChange={(e) => setOnlyNovedades(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="onlyNovedades" className="text-sm text-[#1C1C1C]">
                      Mostrar solo novedades (con badge)
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <SecondaryButton
                    onClick={() => {
                      setSearch("");
                      setCategoriaActiva("Todos");
                      setSort("relevance");
                      setOnlyNovedades(false);
                    }}
                    className="px-6 py-3"
                    type="button"
                  >
                    Limpiar filtros
                  </SecondaryButton>
                  <PrimaryButton onClick={() => setShowFilters(false)} className="px-6 py-3" type="button">
                    Aplicar
                  </PrimaryButton>
                </div>
              </div>
            </div>
          )}

          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p, index) => (
              <div
                key={p.id}
                className="transform hover:scale-105 transition-transform duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard title={p.titulo} price={p.precio} badge={p.badge} image={p.image} />
              </div>
            ))}
          </div>

          {/* Sin resultados */}
          {filteredProducts.length === 0 && (
            <div className="mt-10 text-center text-[#666666]">
              <p className="font-semibold text-[#1C1C1C]">Sin resultados</p>
              <p className="text-sm mt-1">Intenta con otra palabra o cambia los filtros.</p>
            </div>
          )}

          {/* Paginación (visual) */}
          <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-[#E0E0E0]">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#E0E0E0] text-[#666666] hover:border-[#4A90E2] hover:text-[#4A90E2]">
              ←
            </button>
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium ${
                  page === 1 ? "bg-[#FFD54F] text-[#1C1C1C]" : "text-[#666666] hover:bg-[#FFF9E6]"
                }`}
              >
                {page}
              </button>
            ))}
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#E0E0E0] text-[#666666] hover:border-[#4A90E2] hover:text-[#4A90E2]">
              →
            </button>
          </div>

          {/* Sección de ayuda */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-[#4A90E2]/5 to-[#AF69EE]/5 border border-[#4A90E2]/20">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-[#1C1C1C] mb-3">¿No encuentras lo que buscas?</h3>
              <p className="text-[#666666] mb-6">
                Contáctanos y te ayudaremos a encontrar el producto perfecto para tus necesidades.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PrimaryButton className="px-8 py-3">💬 Contactar asesor</PrimaryButton>
                <SecondaryButton className="px-8 py-3">📞 Llamar por teléfono</SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
