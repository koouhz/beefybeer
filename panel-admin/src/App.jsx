// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // ← Quita BrowserRouter de aquí
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import RolesCargos from "./pages/RolesCargos";
import Sueldos from "./pages/Sueldos";
import Personal from "./pages/Personal";
import Inventario from "./pages/Inventario";
import Login from "./pages/Login";
import Mesas from "./pages/Mesas";
import Pedidos from "./pages/Pedidos";
import Ventas from "./pages/Ventas";
import Proveedores from "./pages/Proveedores";
import Productos from "./pages/Productos";
import Gastos from "./pages/Gastos";

function App() {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un empleado logeado en localStorage
    const savedEmpleado = localStorage.getItem('empleado');
    if (savedEmpleado) {
      setEmpleado(JSON.parse(savedEmpleado));
    }
    setLoading(false);
  }, []);

  const handleLogin = (empleadoData) => {
    setEmpleado(empleadoData);
  };

  const handleLogout = () => {
    localStorage.removeItem('empleado');
    setEmpleado(null);
  };

  if (loading) {
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

  return (
    // ← Quitamos BrowserRouter de aquí porque ya está en main.jsx
    <>
      {!empleado ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Routes>
          <Route path="/" element={<Layout onLogout={handleLogout} empleado={empleado} />}>
            <Route index element={<Dashboard />} />
            <Route path="roles-cargos" element={<RolesCargos />} />
            <Route path="sueldos" element={<Sueldos />} />
            <Route path="personal" element={<Personal />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="mesas" element={<Mesas />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="productos" element={<Productos />} />
            <Route path="gastos" element={<Gastos />} />
          </Route>
        </Routes>
      )}
    </>
  );
}

export default App;