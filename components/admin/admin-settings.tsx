"use client"

import type React from "react"

import { useState } from "react"
import { useRestaurant } from "@/components/context/restaurant-context"

export default function AdminSettings() {
  const { info, updateInfo } = useRestaurant()
  const [formData, setFormData] = useState(info)

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateInfo(formData)
    alert("Información actualizada correctamente")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="section-title mb-6">Configuración del Restaurante</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Nombre del Restaurante</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="input-rustic"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className="input-rustic"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Correo Electrónico</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="input-rustic"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="input-rustic"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Dirección</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="input-rustic"
            required
          />
        </div>
        <button type="submit" className="rustic-button w-full">
          Guardar Cambios
        </button>
      </form>
    </div>
  )
}
