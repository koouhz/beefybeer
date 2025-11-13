"use client"

import { useRestaurant } from "@/components/context/restaurant-context"
import { UtensilsCrossed } from "lucide-react"

export default function MenuSection() {
  const { menu } = useRestaurant()

  const categories = ["Entrada", "Plato Principal", "Postre"]
  const items = menu.filter((m) => m.available)

  return (
    <section id="menu" className="py-16 px-6 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <UtensilsCrossed className="text-primary" size={32} />
          </div>
          <h2 className="section-title">Nuestro Menú</h2>
          <p className="section-subtitle">Platos auténticos preparados con amor</p>
        </div>

        {categories.map((category) => {
          const categoryItems = items.filter((item) => item.category === category)
          if (categoryItems.length === 0) return null

          return (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-bold text-primary mb-6 pb-3 border-b-2 border-secondary">{category}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {categoryItems.map((item) => (
                  <div key={item.id} className="wooden-card p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-semibold text-foreground">{item.name}</h4>
                      <span className="text-primary font-bold text-lg">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
