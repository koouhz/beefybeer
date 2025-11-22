// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import MeseroLayout from "./layout/MeseroLayout";
import Login from "./pages/Login";

// Import páginas de admin
import Dashboard from "./pages/admin/Dashboard";
import RolesCargos from "./pages/admin/RolesCargos";
import Sueldos from "./pages/admin/Sueldos";
import Personal from "./pages/admin/Personal";
import Inventario from "./pages/admin/Inventario";
import Mesas from "./pages/admin/Mesas";
import Pedidos from "./pages/admin/Pedidos";
import Ventas from "./pages/admin/Ventas";
import Proveedores from "./pages/admin/Proveedores";
import Recetas from "./pages/admin/Recetas";
import Gastos from "./pages/admin/Gastos";

// Import páginas de mesero
import MeseroDashboard from "./pages/mesero/MeseroDashboard";
import MesasMesero from "./pages/mesero/Mesas";
import PedidosMesero from "./pages/mesero/Pedidos";

function App() {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 App mounted - checking localStorage");
    const savedEmpleado = localStorage.getItem('empleado');
    console.log("📦 localStorage empleado:", savedEmpleado);
    
    if (savedEmpleado) {
      try {
        const empleadoData = JSON.parse(savedEmpleado);
        console.log("✅ Empleado encontrado:", empleadoData);
        console.log("🎯 Tipo de usuario:", empleadoData.tipo_usuario);
        setEmpleado(empleadoData);
      } catch (error) {
        console.error("❌ Error parsing empleado:", error);
      }
    } else {
      console.log("❌ No hay empleado en localStorage");
    }
    setLoading(false);
  }, []);

  const handleLogin = (empleadoData) => {
    console.log("🔑 Login successful:", empleadoData);
    console.log("🎯 Tipo de usuario después de login:", empleadoData.tipo_usuario);
    setEmpleado(empleadoData);
  };

  const handleLogout = () => {
    console.log("🚪 Cerrando sesión");
    localStorage.removeItem('empleado');
    setEmpleado(null);
  };

  if (loading) {
    console.log("⏳ Loading...");
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #fef5e6 0%, #f8e1c5 100%)"
      }}>
        <div style={{ color: "#7a3b06", fontSize: "18px" }}>Cargando...</div>
      </div>
    );
  }

  console.log("🎯 App rendering - empleado:", empleado);
  console.log("🎯 Tipo de usuario:", empleado?.tipo_usuario);
  console.log("🎯 Mostrando:", empleado ? "APP" : "LOGIN");

  return (
    <>
      {!empleado ? (
        console.log("🔐 Mostrando Login") || <Login onLogin={handleLogin} />
      ) : (
        console.log("🚀 Mostrando Rutas para:", empleado.tipo_usuario) || (
          <Routes>
            {/* RUTAS PARA ADMIN */}
            {empleado.tipo_usuario === 'admin' && (
              console.log("👑 Configurando rutas de ADMIN") || (
                <Route path="/admin" element={<AdminLayout onLogout={handleLogout} empleado={empleado} />}>
                  <Route index element={<Dashboard />} />
                  <Route path="roles-cargos" element={<RolesCargos />} />
                  <Route path="sueldos" element={<Sueldos />} />
                  <Route path="personal" element={<Personal />} />
                  <Route path="inventario" element={<Inventario />} />
                  <Route path="mesas" element={<Mesas />} />
                  <Route path="pedidos" element={<Pedidos />} />
                  <Route path="ventas" element={<Ventas />} />
                  <Route path="proveedores" element={<Proveedores />} />
                  <Route path="recetas" element={<Recetas />} />
                  <Route path="gastos" element={<Gastos />} />
                </Route>
              )
            )}

            {/* RUTAS PARA MESERO */}
            {empleado.tipo_usuario === 'mesero' && (
              console.log("🍽️ Configurando rutas de MESERO") || (
                <Route path="/mesero" element={<MeseroLayout onLogout={handleLogout} empleado={empleado} />}>
                  <Route index element={<MeseroDashboard />} />
                  <Route path="mesas" element={<MesasMesero />} />
                  <Route path="pedidos" element={<PedidosMesero />} />
                </Route>
              )
            )}

            {/* REDIRECCIÓN AUTOMÁTICA SEGÚN ROL */}
            <Route path="/" element={
              console.log("🔄 Redirigiendo a:", empleado.tipo_usuario === 'admin' ? '/admin' : '/mesero') || (
                <Navigate to={
                  empleado.tipo_usuario === 'admin' ? '/admin' : '/mesero'
                } replace />
              )
            } />

            {/* Ruta de fallback para cualquier otra ruta */}
            <Route path="*" element={
              console.log("🔄 Redirigiendo ruta desconocida") || (
                <Navigate to={
                  empleado.tipo_usuario === 'admin' ? '/admin' : '/mesero'
                } replace />
              )
            } />
          </Routes>
        )
      )}
    </>
  );
}

export default App;