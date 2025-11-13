"use client"

import type React from "react"

import { useState } from "react"
import { useRestaurant, type MenuItem } from "@/components/context/restaurant-context"
import { Trash2, Plus, Edit2 } from "lucide-react"

export default function AdminMenuManager() {
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useRestaurant()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<MenuItem>({
    id: "",
    name: "",
    description: "",
    price: 0,
    category: "Plato Principal",
    available: true,
  })

  const categories = ["Entrada", "Plato Principal", "Postre", "Bebida"]

  const handleAddClick = () => {
    setFormData({
      id: Date.now().toString(),
      name: "",
      description: "",
      price: 0,
      category: "Plato Principal",
      available: true,
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEditClick = (item: MenuItem) => {
    setFormData(item)
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMenuItem(editingId, formData)
    } else {
      addMenuItem(formData)
    }
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="section-title">Gestionar Menú</h2>
        <button onClick={handleAddClick} className="rustic-button flex items-center gap-2">
          <Plus size={20} />
          Agregar Platillo
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="wooden-card p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-foreground">{editingId ? "Editar Platillo" : "Nuevo Platillo"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-rustic"
                  placeholder="Nombre del platillo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-rustic"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="input-rustic"
                placeholder="Describe el platillo"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                  required
                  className="input-rustic"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-foreground">Disponible</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="rustic-button flex-1">
                {editingId ? "Actualizar" : "Crear"} Platillo
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items List */}
      <div className="space-y-4">
        {menu.map((item) => (
          <div key={item.id} className="wooden-card p-4 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-semibold text-foreground">{item.name}</h4>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{item.category}</span>
                {!item.available && (
                  <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                    No Disponible
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
              <p className="text-primary font-bold">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleEditClick(item)}
                className="p-2 rounded-md bg-secondary text-secondary-foreground hover:opacity-80 transition"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => deleteMenuItem(item.id)}
                className="p-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-80 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
