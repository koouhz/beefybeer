import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/beefybeer/", // 👈 aquí va el nombre exacto del repo
})
