// src/layout/AdminLayout.jsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AdminLayout({ onLogout, empleado }) {
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
      {/* Sidebar para Admin */}
      <Sidebar onLogout={onLogout} empleado={empleado} userType="admin" />

      {/* Contenido dinámico según la ruta */}
      <main style={{
        flex: 1,
        overflowY: "auto",
        padding: "25px 25px 25px 20px",
        background: "#fdf6e3",
        width: "100%",
        boxSizing: "border-box",
        position: "relative"
      }}>
        <Outlet />
      </main>
    </div>
  );
}