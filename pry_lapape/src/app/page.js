import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { productos } from "@/lib/mock";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { Search, Filter, Sparkles } from "lucide-react";

export default function HomePage(){
  return (
    <>
      <Header/>
      
      {/* Hero Section - Mejorado según guía */}
      <section className="py-16 bg-gradient-to-br from-[#FFF9E6] to-[#FFFDEF]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Texto principal */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-[#FFD54F]" size={24} />
              <span className="text-[#EC5DBB] font-semibold text-sm uppercase tracking-wide">
                Tu papelería creativa
              </span>
            </div>
            
            <h1 className="font-bold text-5xl lg:text-6xl text-[#1C1C1C] leading-tight">
              ¡Bienvenido a <span className="text-[#4A90E2]">La Pape</span>!
            </h1>
            
            <p className="text-lg text-[#333333] leading-relaxed max-w-lg">
              Todo lo que necesitas para escuela, oficina y tus proyectos más creativos. 
              Calidad, color y diversión en un solo lugar.
            </p>
            
            {/* Botones mejorados */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <PrimaryButton className="flex items-center gap-3 px-8 py-4 text-lg">
                <Search size={20} />
                Explorar productos
              </PrimaryButton>
              <SecondaryButton className="flex items-center gap-3 px-8 py-4 text-lg">
                <Filter size={20} />
                Filtrar categorías
              </SecondaryButton>
            </div>
            
            {/* Etiquetas mejoradas */}
            <div className="flex flex-wrap gap-3 pt-6">
              <span className="px-4 py-2 rounded-full bg-[#FFF3B0] text-[#1C1C1C] font-medium text-sm border border-[#FFD54F]/30">
                🎒 Back to school
              </span>
              <span className="px-4 py-2 rounded-full bg-[#EC5DBB]/10 text-[#EC5DBB] font-medium text-sm border border-[#EC5DBB]/20">
                ✨ Novedades
              </span>
              <span className="px-4 py-2 rounded-full bg-[#2DC5A1]/10 text-[#2DC5A1] font-medium text-sm border border-[#2DC5A1]/20">
                🔥 Promociones
              </span>
              <span className="px-4 py-2 rounded-full bg-[#AF69EE]/10 text-[#AF69EE] font-medium text-sm border border-[#AF69EE]/20">
                🎨 Creativos
              </span>
            </div>
          </div>
          
          {/* Grid de productos destacados */}
        <div className="relative">
        <div className="bg-white rounded-3xl shadow-lg border border-[#F0F0F0] p-8 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#1C1C1C]">
                Productos Destacados
            </h2>
            <div className="w-3 h-3 rounded-full bg-[#2DC5A1] animate-pulse"></div>
            </div>

            <div className="grid grid-cols-2 gap-5">
            {productos.slice(0, 4).map((p, index) => (
                <div
                key={p.id}
                className="transform hover:scale-105 transition-transform duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
                >
                <ProductCard
                    title={p.titulo}
                    price={p.precio}
                    badge={p.badge}
                    image={p.image}     // <— AQUÍ
                />
                </div>
            ))}
            </div>


              
              {/* Decoración de esquina */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FFD54F] rounded-full opacity-60"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#4A90E2] rounded-full opacity-40"></div>
            </div>
            
            {/* Elementos decorativos flotantes */}
            <div className="absolute -z-10 top-10 -right-10 w-20 h-20 bg-[#EC5DBB]/10 rounded-full blur-xl"></div>
            <div className="absolute -z-10 bottom-10 -left-10 w-16 h-16 bg-[#4A90E2]/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>
      
      {/* Sección de beneficios */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-[#FFF9E6]/30 hover:bg-[#FFF9E6]/50 transition-colors">
              <div className="w-12 h-12 bg-[#FFD54F] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🚚</span>
              </div>
              <h3 className="font-semibold text-[#1C1C1C] mb-2">Envío Rápido</h3>
              <p className="text-[#666666] text-sm">Recibe tus productos en 24-48 horas</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-[#EC5DBB]/5 hover:bg-[#EC5DBB]/10 transition-colors">
              <div className="w-12 h-12 bg-[#EC5DBB] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">💝</span>
              </div>
              <h3 className="font-semibold text-[#1C1C1C] mb-2">Calidad Premium</h3>
              <p className="text-[#666666] text-sm">Productos seleccionados con amor</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-[#4A90E2]/5 hover:bg-[#4A90E2]/10 transition-colors">
              <div className="w-12 h-12 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🎨</span>
              </div>
              <h3 className="font-semibold text-[#1C1C1C] mb-2">Creatividad</h3>
              <p className="text-[#666666] text-sm">Inspiración para tus proyectos</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}