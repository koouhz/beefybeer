"use client"

import { useState } from "react"
import Hero from "@/components/home/hero"
import MenuSection from "@/components/home/menu-section"
import HoursSection from "@/components/home/hours-section"
import AdminButton from "@/components/home/admin-button"
import AdminPanel from "@/components/admin/admin-panel"

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {showAdmin ? (
        <AdminPanel onBack={() => setShowAdmin(false)} />
      ) : (
        <>
          <Hero onAdminClick={() => setShowAdmin(true)} />
          <MenuSection />
          <HoursSection />
          <AdminButton onClick={() => setShowAdmin(true)} />
        </>
      )}
    </div>
  )
}
