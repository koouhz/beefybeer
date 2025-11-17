import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Home, Shield, DollarSign, Users, Package, 
  UtensilsCrossed, Receipt, ShoppingCart, Truck, 
  BookOpen, Wallet, Menu, X 
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const items = [
    { label: "Panel principal", icon: Home, path: "/" },
    { label: "Roles y cargos", icon: Shield, path: "/roles-cargos" },
    { label: "Sueldos", icon: DollarSign, path: "/sueldos" },
    { label: "Personal", icon: Users, path: "/personal" },
    { label: "Inventario", icon: Package, path: "/inventario" },
    { label: "Mesas", icon: UtensilsCrossed, path: "/mesas" },
    { label: "Pedidos", icon: Receipt, path: "/pedidos" },
    { label: "Ventas", icon: ShoppingCart, path: "/ventas" },
    { label: "Proveedores", icon: Truck, path: "/proveedores" },
    { label: "Recetas", icon: BookOpen, path: "/recetas" },
    { label: "Gastos", icon: Wallet, path: "/gastos" },
  ];

  return (
    <>
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            zIndex: 1001,
            background: "#7a3b06",
            color: "white",
            border: "none",
            borderRadius: "8px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 998,
          }}
        />
      )}

      <aside
        style={{
          width: isMobile ? "280px" : "250px",
          height: "100vh",
          background: "linear-gradient(145deg, #f7dca1, #f2c786)",
          padding: "25px 20px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
          position: isMobile ? "fixed" : "relative",
          left: isMobile ? (isOpen ? "0" : "-280px") : "0",
          top: 0,
          zIndex: 999,
          transition: "left 0.3s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ 
          marginBottom: "25px", 
          textAlign: "center",
          flexShrink: 0 
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: "22px", 
            fontWeight: 700, 
            color: "#7a3b06",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              background: "linear-gradient(135deg, #7a3b06, #a85a1a)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f7dca1",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              B&B
            </div>
            Beef & Beer
          </h2>
          <span style={{ fontSize: "13px", color: "#6d4611", opacity: 0.9 }}>
            Sistema de gestión
          </span>
        </div>

        {/* Navigation con Scroll */}
        <nav style={{ 
          flex: 1, 
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "5px",
        }}>
          <ul style={{ 
            listStyle: "none", 
            padding: 0, 
            margin: 0,
          }}>
            {items.map((item, index) => {
              const active = location.pathname === item.path;
              const IconComponent = item.icon;
              
              return (
                <li
                  key={index}
                  style={{
                    marginBottom: "6px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    transition: "all 0.25s ease",
                    background: active ? "linear-gradient(135deg, #f7dca1, #e6b85c)" : "transparent",
                    color: active ? "#7a3b06" : "#6b4505",
                    fontWeight: active ? "600" : "500",
                    boxShadow: active ? "0 4px 12px rgba(122, 59, 6, 0.15)" : "none",
                    position: "relative",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(122, 59, 6, 0.08)";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "3px",
                        background: "#7a3b06",
                        borderRadius: "0 2px 2px 0",
                      }}
                    />
                  )}
                  <Link
                    to={item.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      color: "inherit",
                      textDecoration: "none",
                      fontSize: "14px",
                      transition: "all 0.25s ease",
                    }}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        background: active ? "rgba(122, 59, 6, 0.12)" : "rgba(122, 59, 6, 0.06)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <IconComponent size={16} />
                    </span>
                    <span style={{ 
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div style={{ 
          flexShrink: 0,
          fontSize: "12px", 
          color: "#6d4611", 
          textAlign: "center", 
          opacity: 0.8,
          padding: "15px 0 5px",
          borderTop: "1px solid rgba(122, 59, 6, 0.1)",
          marginTop: "15px"
        }}>
          © 2025 Beef & Beer
        </div>

        {/* Estilos del Scrollbar */}
        <style>
          {`
            nav::-webkit-scrollbar {
              width: 4px;
            }
            
            nav::-webkit-scrollbar-track {
              background: rgba(122, 59, 6, 0.1);
              border-radius: 2px;
            }
            
            nav::-webkit-scrollbar-thumb {
              background: rgba(122, 59, 6, 0.3);
              border-radius: 2px;
            }
            
            nav::-webkit-scrollbar-thumb:hover {
              background: rgba(122, 59, 6, 0.5);
            }
          `}
        </style>
      </aside>
    </>
  );
}