"use client"

import { Settings } from "lucide-react"

interface AdminButtonProps {
  onClick: () => void
}

export default function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl hover:opacity-80 transition flex items-center gap-2 z-40"
      aria-label="Abrir panel de administración"
    >
      <Settings size={24} />
    </button>
  )
}
