"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
}

export interface RestaurantInfo {
  name: string
  description: string
  email: string
  phone: string
  address: string
}

export interface Hours {
  monday_friday: string
  saturday: string
  sunday: string
}

interface RestaurantContextType {
  info: RestaurantInfo
  updateInfo: (info: RestaurantInfo) => void
  menu: MenuItem[]
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, item: MenuItem) => void
  deleteMenuItem: (id: string) => void
  hours: Hours
  updateHours: (hours: Hours) => void
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined)

const defaultInfo: RestaurantInfo = {
  name: "Sabor Rústico",
  description: "Experiencia gastronómica auténtica con ingredientes de la mejor calidad",
  email: "info@saborrustico.com",
  phone: "+1 (555) 123-4567",
  address: "123 Calle Principal, Ciudad, País",
}

const defaultHours: Hours = {
  monday_friday: "11:00 AM - 10:00 PM",
  saturday: "12:00 PM - 11:00 PM",
  sunday: "12:00 PM - 9:00 PM",
}

const defaultMenu: MenuItem[] = [
  {
    id: "1",
    name: "Tabla de Quesos Artesanales",
    description: "Selección de quesos locales con miel y frutos secos",
    price: 18.5,
    category: "Entrada",
    available: true,
  },
  {
    id: "2",
    name: "Sopa de Champiñones Silvestres",
    description: "Con crema de trufa y pan tostado casero",
    price: 12.0,
    category: "Entrada",
    available: true,
  },
  {
    id: "3",
    name: "Carne Asada Premium",
    description: "Corte premium marinado en hierbas rústicas",
    price: 28.5,
    category: "Plato Principal",
    available: true,
  },
  {
    id: "4",
    name: "Pescado al Horno",
    description: "Pescado fresco del día con vegetales asados",
    price: 24.0,
    category: "Plato Principal",
    available: true,
  },
  {
    id: "5",
    name: "Pasta Casera de la Abuela",
    description: "Hecha a mano con salsa de tomate casera",
    price: 16.0,
    category: "Plato Principal",
    available: true,
  },
  {
    id: "6",
    name: "Postre de Chocolate Rústico",
    description: "Torta de chocolate con frambuesas y helado",
    price: 8.5,
    category: "Postre",
    available: true,
  },
]

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<RestaurantInfo>(defaultInfo)
  const [menu, setMenu] = useState<MenuItem[]>(defaultMenu)
  const [hours, setHours] = useState<Hours>(defaultHours)

  const updateInfo = (newInfo: RestaurantInfo) => {
    setInfo(newInfo)
  }

  const addMenuItem = (item: MenuItem) => {
    setMenu([...menu, item])
  }

  const updateMenuItem = (id: string, updatedItem: MenuItem) => {
    setMenu(menu.map((item) => (item.id === id ? updatedItem : item)))
  }

  const deleteMenuItem = (id: string) => {
    setMenu(menu.filter((item) => item.id !== id))
  }

  const updateHours = (newHours: Hours) => {
    setHours(newHours)
  }

  return (
    <RestaurantContext.Provider
      value={{
        info,
        updateInfo,
        menu,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        hours,
        updateHours,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  )
}

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (!context) {
    throw new Error("useRestaurant debe ser usado dentro de RestaurantProvider")
  }
  return context
}
