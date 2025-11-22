import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ← Agregar esta importación
import { supabase } from "../../bd/supabaseClient";
import { UtensilsCrossed, ShoppingCart, Users, DollarSign } from "lucide-react";

export default function MeseroDashboard() {
  const [estadisticas, setEstadisticas] = useState({
    mesasOcupadas: 0,
    pedidosActivos: 0,
    totalMesas: 0,
    ventasHoy: 0
  });
  
  const navigate = useNavigate(); // ← Hook para navegación

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const [mesasRes, pedidosRes, ventasRes] = await Promise.all([
        supabase.from('mesas').select('*'),
        supabase.from('pedidos').select('*'),
        supabase.from('ventas').select('monto_total')
          .gte('fecha', new Date().toISOString().split('T')[0])
      ]);

      const mesasOcupadas = (mesasRes.data || []).filter(m => m.estado === 'ocupada').length;
      const totalMesas = (mesasRes.data || []).length;
      const pedidosActivos = (pedidosRes.data || []).length;
      const ventasHoy = (ventasRes.data || []).reduce((sum, v) => sum + (v.monto_total || 0), 0);

      setEstadisticas({
        mesasOcupadas,
        pedidosActivos,
        totalMesas,
        ventasHoy
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Funciones de navegación
  const irANuevoPedido = () => {
    navigate('/mesero/pedidos');
  };

  const irAVerMesas = () => {
    navigate('/mesero/mesas');
  };

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px" }}>
          Panel del Mesero
        </h1>
        <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
          Resumen y acceso rápido del sistema
        </p>
      </header>

      {/* Tarjetas de Estadísticas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <div style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "50px",
            height: "50px",
            backgroundColor: "rgba(122, 59, 6, 0.1)",
            borderRadius: "10px",
            marginBottom: "15px"
          }}>
            <UtensilsCrossed size={24} color="#7a3b06" />
          </div>
          <h3 style={{ color: "#7a3b06", marginBottom: "10px", fontSize: "16px" }}>Mesas Ocupadas</h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#7a3b06", margin: 0 }}>
            {estadisticas.mesasOcupadas}/{estadisticas.totalMesas}
          </p>
        </div>

        <div style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "50px",
            height: "50px",
            backgroundColor: "rgba(122, 59, 6, 0.1)",
            borderRadius: "10px",
            marginBottom: "15px"
          }}>
            <ShoppingCart size={24} color="#7a3b06" />
          </div>
          <h3 style={{ color: "#7a3b06", marginBottom: "10px", fontSize: "16px" }}>Pedidos Activos</h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#7a3b06", margin: 0 }}>
            {estadisticas.pedidosActivos}
          </p>
        </div>

        <div style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "50px",
            height: "50px",
            backgroundColor: "rgba(122, 59, 6, 0.1)",
            borderRadius: "10px",
            marginBottom: "15px"
          }}>
            <DollarSign size={24} color="#7a3b06" />
          </div>
          <h3 style={{ color: "#7a3b06", marginBottom: "10px", fontSize: "16px" }}>Ventas Hoy</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#7a3b06", margin: 0 }}>
            Bs. {estadisticas.ventasHoy.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div style={{
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        border: "1px solid #e9d8b5"
      }}>
        <h2 style={{ color: "#7a3b06", marginBottom: "20px" }}>Acciones Rápidas</h2>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <button 
            onClick={irANuevoPedido} // ← Agregar onClick aquí
            style={{
              padding: "15px 25px",
              backgroundColor: "#7a3b06",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#6d4611";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#7a3b06";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <ShoppingCart size={18} />
            Nuevo Pedido
          </button>
          
          <button 
            onClick={irAVerMesas} // ← Agregar onClick aquí
            style={{
              padding: "15px 25px",
              backgroundColor: "white",
              color: "#7a3b06",
              border: "1px solid #7a3b06",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#7a3b06";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#7a3b06";
            }}
          >
            <UtensilsCrossed size={18} />
            Ver Mesas
          </button>
        </div>
      </div>
    </div>
  );
}