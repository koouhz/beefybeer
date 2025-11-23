// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { 
  TrendingUp, Users, ShoppingCart, Package, Utensils, AlertTriangle, 
  Plus, Box, User, RefreshCw, Eye, DollarSign,
  ChefHat, Coffee, Beer
} from "lucide-react";
import { supabase } from "../bd/supabaseClient";

// Agregar estilos globales una sola vez
const addGlobalStyles = () => {
  if (document.getElementById('dashboard-styles')) return;
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-styles';
  styleSheet.textContent = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(styleSheet);
};

// Componente de Header del Dashboard
function DashboardHeader({ lastUpdate, onRefresh, loading }) {
  const formatFullDate = (date) => {
    if (!date) return 'Cargando...';
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header style={styles.header}>
      <div style={styles.headerContent}>
        <div style={styles.headerTitle}>
          <h1 style={styles.title}>Panel Principal</h1>
          <p style={styles.subtitle}>
            <span style={styles.statusDot}></span>
            Actualizado: {formatFullDate(lastUpdate)}
          </p>
        </div>
        
        <div style={styles.headerActions}>
          <div style={styles.restaurantBadge}>
            <Coffee size={16} />
            Beef & Beer
          </div>
          <button 
            onClick={onRefresh}
            disabled={loading}
            style={{
              ...styles.refreshButton,
              ...(loading ? styles.refreshButtonDisabled : {})
            }}
            title="Actualizar estadísticas"
          >
            <RefreshCw 
              size={16} 
              style={loading ? { animation: "spin 1s linear infinite" } : {}} 
            />
            Actualizar
          </button>
        </div>
      </div>
    </header>
  );
}

// Componente de Caja de Estadística
function StatBox({ title, value, icon, type = "default" }) {
  const boxStyle = type === "warning" 
    ? { ...styles.statBox, ...styles.statBoxWarning }
    : type === "success" 
    ? { ...styles.statBox, ...styles.statBoxSuccess }
    : styles.statBox;

  const iconStyle = type === "warning" 
    ? { ...styles.statIcon, ...styles.statIconWarning }
    : styles.statIcon;

  const valueStyle = type === "warning" 
    ? { ...styles.statValue, ...styles.statValueWarning }
    : styles.statValue;

  return (
    <div style={boxStyle}>
      <div style={iconStyle}>
        {icon}
      </div>
      <div style={styles.statContent}>
        <div style={valueStyle}>{value}</div>
        <div style={styles.statTitle}>{title}</div>
      </div>
    </div>
  );
}

// Componente de Acciones Rápidas
function QuickActions({ onAction }) {
  const actions = [
    { 
      key: 'pedido', 
      label: 'Nuevo Pedido', 
      icon: <Plus size={20} />,
      description: 'Crear nuevo pedido'
    },
    { 
      key: 'inventario', 
      label: 'Ver Inventario', 
      icon: <Box size={20} />,
      description: 'Gestionar stock'
    },
    { 
      key: 'personal', 
      label: 'Gestionar Personal', 
      icon: <User size={20} />,
      description: 'Administrar empleados'
    },
    { 
      key: 'ventas', 
      label: 'Ver Ventas', 
      icon: <Eye size={20} />,
      description: 'Reportes de ventas'
    }
  ];

  return (
    <section style={styles.quickActions}>
      <h2 style={styles.quickActionsTitle}>Acciones Rápidas</h2>
      <div style={styles.actionsGrid}>
        {actions.map(action => (
          <button
            key={action.key}
            onClick={() => onAction(action.key)}
            style={styles.actionButton}
            title={action.description}
          >
            <div style={styles.actionIcon}>
              {action.icon}
            </div>
            <span style={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// Componente de Carga
function DashboardSkeleton() {
  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTitle}>
            <h1 style={styles.title}>Panel Principal</h1>
            <p style={styles.subtitle}>
              <span style={styles.statusDot}></span>
              Actualizado: Cargando...
            </p>
          </div>
        </div>
      </div>
      <div style={styles.statsGrid}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={styles.cardSkeleton}>
            <div style={styles.skeletonLoader}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    pedidosActivos: 0,
    mesasOcupadas: 0,
    empleadosActivos: 0,
    productosBajos: 0,
    promedioTicket: 0,
    productosCategoria: { comida: 0, bebida: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Agregar estilos globales al montar el componente
  useEffect(() => {
    addGlobalStyles();
  }, []);

  // Formateadores
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Funciones corregidas para obtener datos
  const fetchVentasHoy = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('ventas')
      .select('monto_total')
      .gte('fecha', `${hoy}T00:00:00`)
      .lte('fecha', `${hoy}T23:59:59`);

    if (error) {
      console.error('Error fetching ventas hoy:', error);
      return { total: 0, count: 0 };
    }
    
    return {
      total: data.reduce((sum, venta) => sum + (parseFloat(venta.monto_total) || 0), 0),
      count: data.length
    };
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
    
    return data.reduce((sum, venta) => sum + (parseFloat(venta.monto_total) || 0), 0);
  };

  const fetchPedidosActivos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id_pedido')
      .not('nromesa', 'is', null);

    if (error) {
      console.error('Error fetching pedidos activos:', error);
      return 0;
    }
    return data?.length || 0;
  };

  const fetchMesasOcupadas = async () => {
    const { data, error } = await supabase
      .from('mesas')
      .select('nromesa')
      .eq('estado', 'ocupada');

    if (error) {
      console.error('Error fetching mesas ocupadas:', error);
      return 0;
    }
    return data?.length || 0;
  };

  const fetchEmpleadosActivos = async () => {
    const { data, error } = await supabase
      .from('empleados')
      .select('ci');

    if (error) {
      console.error('Error fetching empleados activos:', error);
      return 0;
    }
    return data?.length || 0;
  };

  const fetchProductosBajos = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .not('stock_minimo', 'is', null)
        .not('cantidad_actual', 'is', null);

      if (error) {
        console.error('Error fetching inventario:', error);
        return 0;
      }

      const productosBajos = data?.filter(item => 
        item.cantidad_actual <= item.stock_minimo
      ) || [];

      return productosBajos.length;
    } catch (error) {
      console.error('Error en fetchProductosBajos:', error);
      return 0;
    }
  };

  const fetchProductosPorCategoria = async () => {
    try {
      const { data, error } = await supabase
        .from('categoria_productos')
        .select('tipo, productos(id_producto)');

      if (error) {
        console.error('Error fetching categorias:', error);
        return { comida: 0, bebida: 0 };
      }

      const categorias = { comida: 0, bebida: 0 };
      
      data?.forEach(categoria => {
        const count = categoria.productos?.length || 0;
        if (categoria.tipo === 'comida') {
          categorias.comida += count;
        } else if (categoria.tipo === 'bebida') {
          categorias.bebida += count;
        }
      });

      return categorias;
    } catch (error) {
      console.error('Error en fetchProductosPorCategoria:', error);
      return { comida: 0, bebida: 0 };
    }
  };

  // Función principal para cargar estadísticas
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        ventasHoyData,
        ventasSemanaData,
        pedidosActivosData,
        mesasOcupadasData,
        empleadosActivosData,
        productosBajosData,
        productosCategoriaData
      ] = await Promise.all([
        fetchVentasHoy(),
        fetchVentasSemana(),
        fetchPedidosActivos(),
        fetchMesasOcupadas(),
        fetchEmpleadosActivos(),
        fetchProductosBajos(),
        fetchProductosPorCategoria()
      ]);

      const promedio = ventasHoyData.total > 0 && ventasHoyData.count > 0 
        ? ventasHoyData.total / ventasHoyData.count 
        : 0;

      setStats({
        ventasHoy: ventasHoyData.total,
        ventasSemana: ventasSemanaData,
        pedidosActivos: pedidosActivosData,
        mesasOcupadas: mesasOcupadasData,
        empleadosActivos: empleadosActivosData,
        productosBajos: productosBajosData,
        promedioTicket: promedio,
        productosCategoria: productosCategoriaData
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('No se pudieron cargar las estadísticas. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handlers de acciones rápidas
  const handleQuickAction = (action) => {
    const routes = {
      pedido: '/pedidos',
      inventario: '/inventario',
      personal: '/personal',
      ventas: '/ventas'
    };
    
    if (routes[action]) {
      navigate(routes[action]);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* Header */}
      <DashboardHeader 
        lastUpdate={lastUpdate} 
        onRefresh={fetchStats}
        loading={loading}
      />

      {/* Mensaje de error */}
      {error && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={fetchStats} style={styles.retryButton}>
            Reintentar
          </button>
        </div>
      )}

      {/* Estadísticas Principales */}
      <section style={styles.statsGrid}>
        <Card 
          title="Ventas del día" 
          value={formatCurrency(stats.ventasHoy)}
          subtitle={`${stats.ventasHoy > 0 ? '📈 Tendencia positiva' : 'Sin ventas hoy'}`}
          icon={<DollarSign size={20} />}
          trend={stats.ventasHoy > 0 ? "up" : "neutral"}
          onClick={() => handleQuickAction('ventas')}
          clickable
        />
        
        <Card 
          title="Pedidos activos" 
          value={stats.pedidosActivos}
          subtitle={`${stats.mesasOcupadas} mesas ocupadas`}
          icon={<ShoppingCart size={20} />}
          trend={stats.pedidosActivos > 0 ? "up" : "neutral"}
        />
        
        <Card 
          title="Ventas semanales" 
          value={formatCurrency(stats.ventasSemana)}
          subtitle="Últimos 7 días"
          icon={<TrendingUp size={20} />}
          trend={stats.ventasSemana > 0 ? "up" : "neutral"}
        />
        
        <Card 
          title="Personal activo" 
          value={stats.empleadosActivos}
          subtitle="Total empleados"
          icon={<Users size={20} />}
          trend="neutral"
        />
      </section>

      {/* Estadísticas Secundarias */}
      <section style={styles.secondaryStats}>
        <StatBox 
          title="Mesas ocupadas"
          value={stats.mesasOcupadas}
          icon={<Utensils size={18} />}
          type="default"
        />
        
        <StatBox 
          title="Productos bajos en stock"
          value={stats.productosBajos}
          icon={<AlertTriangle size={18} />}
          type={stats.productosBajos > 0 ? "warning" : "success"}
        />
        
        <StatBox 
          title="Ticket promedio"
          value={formatCurrency(stats.promedioTicket)}
          icon={<Package size={18} />}
          type="default"
        />
        
        <div style={styles.categoryStats}>
          <div style={styles.categoryItem}>
            <ChefHat size={16} style={styles.categoryIconFood} />
            <span style={styles.categoryCount}>{stats.productosCategoria.comida}</span>
            <span style={styles.categoryLabel}>Comidas</span>
          </div>
          <div style={styles.categoryItem}>
            <Beer size={16} style={styles.categoryIconDrink} />
            <span style={styles.categoryCount}>{stats.productosCategoria.bebida}</span>
            <span style={styles.categoryLabel}>Bebidas</span>
          </div>
        </div>
      </section>

      {/* Acciones Rápidas */}
      <QuickActions onAction={handleQuickAction} />
    </div>
  );
}

// Estilos en objetos JavaScript (sin cambios)
const styles = {
  dashboardContainer: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "30px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: "28px",
    color: "#7a3b06",
    marginBottom: "8px",
    fontWeight: "700",
    margin: 0,
  },
  subtitle: {
    color: "#6d4611",
    fontSize: "14px",
    opacity: 0.9,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
  },
  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#28a745",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexShrink: 0,
  },
  restaurantBadge: {
    padding: "8px 16px",
    background: "white",
    borderRadius: "8px",
    border: "1px solid #e9d8b5",
    fontSize: "14px",
    color: "#7a3b06",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  refreshButton: {
    padding: "8px 16px",
    background: "#7a3b06",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  refreshButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  errorBanner: {
    background: "#f8d7da",
    color: "#721c24",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #f5c6cb",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    fontSize: "14px",
  },
  retryButton: {
    background: "#dc3545",
    color: "white",
    border: "none",
    padding: "4px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    marginLeft: "auto",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  secondaryStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  },
  statBox: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e9d8b5",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    transition: "all 0.3s ease",
  },
  statBoxWarning: {
    borderColor: "#ff6b6b",
    background: "#fff5f5",
  },
  statBoxSuccess: {
    borderColor: "#28a745",
    background: "#f8fff9",
  },
  statIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: "rgba(122, 59, 6, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7a3b06",
    flexShrink: 0,
  },
  statIconWarning: {
    background: "rgba(220, 53, 69, 0.1)",
    color: "#dc3545",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#7a3b06",
    marginBottom: "4px",
  },
  statValueWarning: {
    color: "#dc3545",
  },
  statTitle: {
    fontSize: "14px",
    color: "#6d4611",
    opacity: 0.8,
  },
  categoryStats: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e9d8b5",
    display: "flex",
    gap: "20px",
    justifyContent: "space-around",
  },
  categoryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  categoryIconFood: {
    padding: "8px",
    borderRadius: "6px",
    background: "rgba(40, 167, 69, 0.1)",
    color: "#28a745",
  },
  categoryIconDrink: {
    padding: "8px",
    borderRadius: "6px",
    background: "rgba(0, 123, 255, 0.1)",
    color: "#007bff",
  },
  categoryCount: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#7a3b06",
  },
  categoryLabel: {
    fontSize: "12px",
    color: "#6d4611",
    opacity: 0.8,
  },
  quickActions: {
    marginTop: "30px",
  },
  quickActionsTitle: {
    fontSize: "20px",
    color: "#7a3b06",
    marginBottom: "20px",
    fontWeight: "600",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  },
  actionButton: {
    padding: "20px 15px",
    background: "white",
    border: "1px solid #e9d8b5",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    fontSize: "16px",
    color: "#7a3b06",
  },
  actionIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    background: "rgba(122, 59, 6, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7a3b06",
  },
  actionLabel: {
    fontWeight: "500",
  },
  cardSkeleton: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e9d8b5",
    height: "140px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "280px",
  },
  skeletonLoader: {
    width: "80%",
    height: "20px",
    background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
    backgroundSize: "200% 100%",
    animation: "loading 1.5s infinite",
    borderRadius: "4px",
  },
};