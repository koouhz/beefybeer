"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import AdminSidebar from "./admin-sidebar"
import AdminMenuManager from "./admin-menu-manager"
import AdminSettings from "./admin-settings"

type AdminTab = "menu" | "settings" | "hours"

interface AdminPanelProps {
  onBack: () => void
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("menu")

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "menu" && <AdminMenuManager />}
          {activeTab === "settings" && <AdminSettings />}
          {activeTab === "hours" && <AdminHours />}
        </div>
      </div>
    </div>
  )
}

function AdminHours() {
  const { hours, updateHours } = require("@/components/context/restaurant-context").useRestaurant()
  const [formData, setFormData] = useState(hours)

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateHours(formData)
    alert("Horarios actualizados correctamente")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="section-title mb-6">Gestionar Horarios</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Lunes a Viernes</label>
          <input
            type="text"
            value={formData.monday_friday}
            onChange={(e) => handleChange("monday_friday", e.target.value)}
            placeholder="11:00 AM - 10:00 PM"
            className="input-rustic"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Sábado</label>
          <input
            type="text"
            value={formData.saturday}
            onChange={(e) => handleChange("saturday", e.target.value)}
            placeholder="12:00 PM - 11:00 PM"
            className="input-rustic"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Domingo</label>
          <input
            type="text"
            value={formData.sunday}
            onChange={(e) => handleChange("sunday", e.target.value)}
            placeholder="12:00 PM - 9:00 PM"
            className="input-rustic"
          />
        </div>
        <button type="submit" className="rustic-button w-full">
          Guardar Cambios
        </button>
      </form>
    </div>
  )
}
