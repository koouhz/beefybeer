"use client"

import { useRestaurant } from "@/components/context/restaurant-context"
import { Clock } from "lucide-react"

export default function HoursSection() {
  const { hours, info } = useRestaurant()

  return (
    <section className="py-16 px-6 md:py-24 bg-card border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Horarios */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-primary" size={28} />
              <h3 className="text-2xl font-bold text-foreground">Horarios</h3>
            </div>
            <div className="space-y-4">
              <div className="wooden-card p-4">
                <p className="font-semibold text-foreground">Lunes a Viernes</p>
                <p className="text-muted-foreground">{hours.monday_friday}</p>
              </div>
              <div className="wooden-card p-4">
                <p className="font-semibold text-foreground">Sábado</p>
                <p className="text-muted-foreground">{hours.saturday}</p>
              </div>
              <div className="wooden-card p-4">
                <p className="font-semibold text-foreground">Domingo</p>
                <p className="text-muted-foreground">{hours.sunday}</p>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-6">Contacto</h3>
            </div>
            <div className="space-y-4">
              <div className="wooden-card p-4">
                <p className="text-sm text-muted-foreground mb-1">Correo</p>
                <p className="font-semibold text-foreground">{info.email}</p>
              </div>
              <div className="wooden-card p-4">
                <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                <p className="font-semibold text-foreground">{info.phone}</p>
              </div>
              <div className="wooden-card p-4">
                <p className="text-sm text-muted-foreground mb-1">Ubicación</p>
                <p className="font-semibold text-foreground">{info.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
