// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import Card from "../components/Card";
import { 
  TrendingUp, Users, ShoppingCart, Package, Utensils, AlertTriangle, 
  Plus, Box, User 
} from "lucide-react";
import { supabase } from "../bd/supabaseClient";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    pedidosActivos: 0,
    mesasOcupadas: 0,
    empleadosActivos: 0,
    productosBajos: 0
  });
  const [loading, setLoading] = useState(true);

  // Función para obtener datos de la API
  const fetchStats = async () => {
    try {
      // Simultáneamente obtener todas las estadísticas
      const [
        ventasHoyData,
        ventasSemanaData,
        pedidosActivosData,
        mesasOcupadasData,
        empleadosActivosData,
        productosBajosData
      ] = await Promise.all([
        fetchVentasHoy(),
        fetchVentasSemana(),
        fetchPedidosActivos(),
        fetchMesasOcupadas(),
        fetchEmpleadosActivos(),
        fetchProductosBajos()
      ]);

      setStats({
        ventasHoy: ventasHoyData,
        ventasSemana: ventasSemanaData,
        pedidosActivos: pedidosActivosData,
        mesasOcupadas: mesasOcupadasData,
        empleadosActivos: empleadosActivosData,
        productosBajos: productosBajosData
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      // Valores por defecto en caso de error
      setStats({
        ventasHoy: 0,
        ventasSemana: 0,
        pedidosActivos: 0,
        mesasOcupadas: 0,
        empleadosActivos: 0,
        productosBajos: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones para obtener datos desde Supabase
  const fetchVentasHoy = async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('monto_total')
      .gte('fecha', new Date().toISOString().split('T')[0])
      .lte('fecha', new Date().toISOString().split('T')[0] + ' 23:59:59');
    
    if (error) {
      console.error('Error fetching ventas hoy:', error);
      return 0;
    }
    
    return data.reduce((sum, venta) => sum + (venta.monto_total || 0), 0);
  };

  const fetchVentasSemana = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const { data, error } = await supabase
      .from('ventas')
      .select('monto_total')
      .gte('fecha', startDate.toISOString());
    
    if (error) {
      console.error('Error fetching ventas semana:', error);
      return 0;
    }
    
    return data.reduce((sum, venta) => sum + (venta.monto_total || 0), 0);
  };

  const fetchPedidosActivos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact' })
      .is('nromesa', null); // Pedidos sin mesa asignada o en proceso
    
    if (error) {
      console.error('Error fetching pedidos activos:', error);
      return 0;
    }
    
    return data.length;
  };

  const fetchMesasOcupadas = async () => {
    const { data, error } = await supabase
      .from('mesas')
      .select('*', { count: 'exact' })
      .eq('estado', 'ocupada');
    
    if (error) {
      console.error('Error fetching mesas ocupadas:', error);
      return 0;
    }
    
    return data.length;
  };

  const fetchEmpleadosActivos = async () => {
    const { data, error } = await supabase
      .from('empleados')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error fetching empleados activos:', error);
      return 0;
    }
    
    return data.length;
  };

  const fetchProductosBajos = async () => {
    const { data, error } = await supabase
      .from('inventario')
      .select('cantidad_actual, stock_minimo, id_producto')
      .lte('cantidad_actual', 'stock_minimo');
    
    if (error) {
      console.error('Error fetching productos bajos:', error);
      return 0;
    }
    
    return data.length;
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  };

  if (loading) {
    return (
      <>
        <header style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", color: "#7a3b06" }}>Panel principal</h1>
          <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
            Cargando estadísticas...
          </p>
        </header>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "20px",
          marginBottom: "20px"
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ 
              width: "100%",
              height: "140px", 
              background: "white", 
              borderRadius: "12px",
              border: "1px solid #e9d8b5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7a3b06",
              minWidth: "280px"
            }}>
              Cargando...
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header style={{ marginBottom: "30px" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start", 
          flexWrap: "wrap", 
          gap: "20px",
          width: "100%"
        }}>
          <div>
            <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
              Panel Principal
            </h1>
            <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", backgroundColor: "#28a745", borderRadius: "50%" }}></span>
              Actualizado: {new Date().toLocaleString('es-ES')}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
            <div style={{ 
              padding: "8px 16px", 
              backgroundColor: "white", 
              borderRadius: "8px", 
              border: "1px solid #e9d8b5", 
              fontSize: "14px", 
              color: "#7a3b06", 
              fontWeight: "500" 
            }}>
              Restaurante: Beef & Beer
            </div>
          </div>
        </div>
      </header>

      {/* Estadísticas Principales */}
      <section style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: "20px", 
        marginBottom: "30px",
        width: "100%"
      }}>
        <Card 
          title="Ventas del día" 
          value={formatCurrency(stats.ventasHoy)}
          subtitle="+15.2% vs ayer"
          icon={<TrendingUp size={20} />}
          trend="up"
        />
        
        <Card 
          title="Pedidos activos" 
          value={stats.pedidosActivos}
          subtitle={`${stats.mesasOcupadas} mesas ocupadas`}
          icon={<ShoppingCart size={20} />}
        />
        
        <Card 
          title="Ventas de la semana" 
          value={formatCurrency(stats.ventasSemana)}
          subtitle="Últimos 7 días"
          icon={<TrendingUp size={20} />}
        />
        
        <Card 
          title="Personal activo" 
          value={stats.empleadosActivos}
          subtitle="Total empleados"
          icon={<Users size={20} />}
        />
      </section>

      {/* Estadísticas Secundarias */}
      <section style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "15px", 
        marginBottom: "30px",
        width: "100%"
      }}>
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: "1px solid #e9d8b5",
          textAlign: "center",
          minWidth: "200px"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#7a3b06", marginBottom: "8px" }}>
            {stats.mesasOcupadas}
          </div>
          <div style={{ fontSize: "14px", color: "#6d4611" }}>Mesas ocupadas</div>
          <Utensils size={16} style={{ marginTop: "8px", color: "#7a3b06", opacity: 0.7 }} />
        </div>

        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: stats.productosBajos > 0 ? "1px solid #ff6b6b" : "1px solid #e9d8b5",
          textAlign: "center",
          minWidth: "200px"
        }}>
          <div style={{ 
            fontSize: "24px", 
            fontWeight: "bold", 
            color: stats.productosBajos > 0 ? "#dc3545" : "#7a3b06",
            marginBottom: "8px" 
          }}>
            {stats.productosBajos}
          </div>
          <div style={{ fontSize: "14px", color: "#6d4611" }}>Productos bajos en stock</div>
          <AlertTriangle size={16} style={{ 
            marginTop: "8px", 
            color: stats.productosBajos > 0 ? "#dc3545" : "#7a3b06", 
            opacity: 0.7 
          }} />
        </div>

        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: "1px solid #e9d8b5",
          textAlign: "center",
          minWidth: "200px"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#7a3b06", marginBottom: "8px" }}>
            {stats.pedidosActivos > 0 ? formatCurrency(stats.ventasHoy / stats.pedidosActivos) : "0 Bs"}
          </div>
          <div style={{ fontSize: "14px", color: "#6d4611" }}>Ticket promedio</div>
          <Package size={16} style={{ marginTop: "8px", color: "#7a3b06", opacity: 0.7 }} />
        </div>
      </section>

      {/* Acciones Rápidas */}
      <section>
        <h2 style={{ 
          fontSize: "20px", 
          color: "#7a3b06", 
          marginBottom: "20px", 
          fontWeight: "600" 
        }}>
          Acciones Rápidas
        </h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px",
          width: "100%"
        }}>
          <button style={{
            padding: "20px 15px",
            backgroundColor: "white",
            border: "1px solid #e9d8b5",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            fontSize: "16px",
            color: "#7a3b06",
            minWidth: "200px"
          }}>
            <Plus size={24} style={{ color: "#7a3b06" }} />
            <span style={{ fontWeight: "500" }}>Nuevo Pedido</span>
          </button>

          <button style={{
            padding: "20px 15px",
            backgroundColor: "white",
            border: "1px solid #e9d8b5",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            fontSize: "16px",
            color: "#7a3b06",
            minWidth: "200px"
          }}>
            <Box size={24} style={{ color: "#7a3b06" }} />
            <span style={{ fontWeight: "500" }}>Ver Inventario</span>
          </button>

          <button style={{
            padding: "20px 15px",
            backgroundColor: "white",
            border: "1px solid #e9d8b5",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            fontSize: "16px",
            color: "#7a3b06",
            minWidth: "200px"
          }}>
            <User size={24} style={{ color: "#7a3b06" }} />
            <span style={{ fontWeight: "500" }}>Gestionar Personal</span>
          </button>
        </div>
      </section>
    </>
  );
}