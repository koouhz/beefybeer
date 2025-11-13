"use client"

import { Menu, Settings, Clock } from "lucide-react"

type AdminTab = "menu" | "settings" | "hours"

interface AdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const tabs = [
    { id: "menu" as const, label: "Menú", icon: Menu },
    { id: "settings" as const, label: "Configuración", icon: Settings },
    { id: "hours" as const, label: "Horarios", icon: Clock },
  ]

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl font-bold">Restaurante Admin</h2>
      </div>
      <nav className="p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === tab.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
