// src/layout/MeseroLayout.jsx
import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function MeseroLayout({ onLogout, empleado }) {
  return (
    <div style={{ 
      height: "100vh", 
      backgroundColor: "#fdf6e3",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header simple para mesero */}
      <header style={{
        padding: "15px 25px",
        backgroundColor: "white",
        borderBottom: "1px solid #e9d8b5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div>
          <h1 style={{ 
            color: "#7a3b06", 
            margin: 0,
            fontSize: "24px",
            fontWeight: "700"
          }}>
            Beef & Beer
          </h1>
          <p style={{ 
            color: "#6d4611", 
            margin: 0,
            fontSize: "14px",
            opacity: 0.8
          }}>
            Sistema de Meseros
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ 
              color: "#7a3b06", 
              margin: 0,
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {empleado?.nombre} {empleado?.pat}
            </p>
            <p style={{ 
              color: "#6d4611", 
              margin: 0,
              fontSize: "12px",
              opacity: 0.8
            }}>
              Mesero
            </p>
          </div>
          
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #7a3b06",
              borderRadius: "6px",
              color: "#7a3b06",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#7a3b06";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#7a3b06";
            }}
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main style={{ 
        flex: 1, 
        overflow: "auto",
        padding: "20px"
      }}>
        <Outlet />
      </main>
    </div>
  );
}