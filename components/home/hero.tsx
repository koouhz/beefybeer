"use client"

import { Utensils } from "lucide-react"

interface HeroProps {
  onAdminClick: () => void
}

export default function Hero({ onAdminClick }: HeroProps) {
  return (
    <div className="relative bg-gradient-to-br from-accent via-primary to-accent/80 text-white py-20 px-6 md:py-32">
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
            <Utensils size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">Sabor Rústico</h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto text-pretty">
          Experiencia gastronómica auténtica con ingredientes de la mejor calidad
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="#menu"
            className="bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-80 transition"
          >
            Ver Menú
          </a>
          <button
            onClick={onAdminClick}
            className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition"
          >
            Panel Admin
          </button>
        </div>
      </div>
    </div>
  )
}
