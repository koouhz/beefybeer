// src/layout/Layout.jsx
import { useState, useEffect } from "react";
// Se elimina la importación de 'Outlet' para usar el renderizado condicional de App.jsx
// Importación de Sidebar con la extensión .jsx corregida.
import Sidebar from "../components/Sidebar.jsx"; 

// Ahora Layout acepta 'children' (el componente de la página actual, ej: Dashboard)
export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);

  useEffect(() => {
    const updateSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarWidth(mobile ? 280 : 250);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      backgroundColor: "#fdf6e3",
      overflow: "hidden"
    }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido dinámico pasado como children desde App.jsx */}
      <main style={{
        flex: 1,
        overflowY: "auto",
        padding: "25px 25px 25px 20px",
        background: "#fdf6e3",
        width: "100%",
        boxSizing: "border-box",
        position: "relative"
      }}>
        {/* Usamos 'children' en lugar de 'Outlet' */}
        {children} 
      </main>
    </div>
  );
}