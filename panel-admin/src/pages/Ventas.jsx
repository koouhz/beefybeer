// src/pages/Ventas.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { InventarioService } from "../services/inventarioService";
import { 
  Edit, 
  Trash2, 
  Plus, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  Receipt,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Save,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Package
} from "lucide-react";

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoProductos, setPedidoProductos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [filtroMontoMin, setFiltroMontoMin] = useState("");
  const [filtroMontoMax, setFiltroMontoMax] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);

  const [form, setForm] = useState({
    descripcion: '',
    id_pedido: '',
    monto_total: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const showMessage = (message, type = "error") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(""), 6000);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [
        ventasRes, 
        pedidosRes, 
        pedidoProductosRes, 
        productosRes,
        empleadosRes,
        mesasRes
      ] = await Promise.all([
        supabase.from('ventas').select('*').order('fecha', { ascending: false }),
        supabase.from('pedidos').select('*'),
        supabase.from('pedido_producto').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('empleados').select('ci, nombre, pat, mat'),
        supabase.from('mesas').select('nromesa, salon')
      ]);
      
      const errors = [
        ventasRes.error, pedidosRes.error, pedidoProductosRes.error, 
        productosRes.error, empleadosRes.error, mesasRes.error
      ].filter(error => error);

      if (errors.length > 0) {
        throw new Error(`Errores al cargar: ${errors.map(e => e.message).join(', ')}`);
      }
      
      setVentas(ventasRes.data || []);
      setPedidos(pedidosRes.data || []);
      setPedidoProductos(pedidoProductosRes.data || []);
      setProductos(productosRes.data || []);
      setEmpleados(empleadosRes.data || []);
      setMesas(mesasRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // VALIDACIONES
  const validateVenta = (ventaData) => {
    const errors = [];

    if (!ventaData.id_pedido) {
      errors.push("Debe seleccionar un pedido");
    }

    if (!ventaData.monto_total || parseFloat(ventaData.monto_total) <= 0) {
      errors.push("El monto total debe ser mayor a 0");
    }

    if (parseFloat(ventaData.monto_total) > 100000) {
      errors.push("El monto total no puede exceder Bs 100,000");
    }

    // Validar que el pedido no tenga ya una venta asociada
    const ventaExistente = ventas.find(v => 
      v.id_pedido === parseInt(ventaData.id_pedido) && v.id_venta !== editingId
    );
    if (ventaExistente) {
      errors.push("Este pedido ya tiene una venta asociada");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  };

  // OBTENER PRODUCTOS DE UN PEDIDO
  const getProductosDelPedido = (idPedido) => {
    return pedidoProductos.filter(pp => pp.id_pedido === idPedido);
  };

  // ACTUALIZAR STOCK AL CREAR VENTA
  const actualizarStockVenta = async (idPedido, accion = 'crear') => {
    try {
      const productosPedido = getProductosDelPedido(idPedido);
      
      if (productosPedido.length === 0) {
        throw new Error("El pedido no tiene productos para actualizar stock");
      }

      // Convertir productos al formato esperado por el servicio
      const movimientos = productosPedido.map(producto => ({
        id_producto: producto.id_producto,
        cantidad: -producto.cantidad, // Negativo porque es salida
        producto: productos.find(p => p.id_producto === producto.id_producto)
      }));

      // Actualizar stock usando el servicio
      const resultado = await InventarioService.actualizarStockMultiple(
        movimientos,
        `venta_${accion}`,
        `Venta - Pedido #${idPedido}`
      );

      return resultado;
    } catch (error) {
      console.error('Error actualizando stock:', error);
      throw error;
    }
  };

  // REVERTIR STOCK AL ELIMINAR VENTA
  const revertirStockVenta = async (idPedido) => {
    try {
      const productosPedido = getProductosDelPedido(idPedido);
      
      if (productosPedido.length === 0) {
        return; // No hay productos que revertir
      }

      // Revertir significa sumar el stock (cantidades positivas)
      const movimientos = productosPedido.map(producto => ({
        id_producto: producto.id_producto,
        cantidad: producto.cantidad, // Positivo porque es entrada (reversión)
        producto: productos.find(p => p.id_producto === producto.id_producto)
      }));

      const resultado = await InventarioService.actualizarStockMultiple(
        movimientos,
        'venta_reversion',
        `Reversión Venta - Pedido #${idPedido}`
      );

      return resultado;
    } catch (error) {
      console.error('Error revirtiendo stock:', error);
      throw error;
    }
  };

  // VERIFICAR STOCK ANTES DE CREAR VENTA
  const verificarStockDisponible = async (idPedido) => {
    try {
      const productosPedido = getProductosDelPedido(idPedido);
      
      if (productosPedido.length === 0) {
        return { todosDisponibles: true, verificaciones: [] };
      }

      const productosRequeridos = productosPedido.map(p => ({
        id_producto: p.id_producto,
        cantidad: p.cantidad
      }));

      const resultado = await InventarioService.verificarDisponibilidad(productosRequeridos);
      return resultado;
    } catch (error) {
      console.error('Error verificando stock:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('guardar');
    
    try {
      const ventaData = {
        ...form,
        id_pedido: parseInt(form.id_pedido),
        monto_total: parseFloat(form.monto_total)
      };

      validateVenta(ventaData);

      // VERIFICAR STOCK ANTES DE PROCEDER
      if (!editingId) {
        const verificacionStock = await verificarStockDisponible(ventaData.id_pedido);
        
        if (!verificacionStock.todosDisponibles) {
          const productosSinStock = verificacionStock.productosSinStock
            .map(p => {
              const producto = productos.find(prod => prod.id_producto === p.id_producto);
              const nombreProducto = producto ? producto.nombre : `Producto #${p.id_producto}`;
              return `${nombreProducto}: Requerido ${p.cantidad_requerida}, Stock ${p.stock_actual}`;
            })
            .join('\n');
          
          throw new Error(`Stock insuficiente para los siguientes productos:\n${productosSinStock}`);
        }
      }

      let result;
      if (editingId) {
        result = await supabase
          .from('ventas')
          .update(ventaData)
          .eq('id_venta', editingId);
      } else {
        result = await supabase
          .from('ventas')
          .insert([ventaData]);
      }
      
      if (result.error) throw result.error;

      // ACTUALIZAR STOCK SOLO PARA NUEVAS VENTAS
      if (!editingId) {
        await actualizarStockVenta(ventaData.id_pedido, 'crear');
      }

      showMessage(`Venta ${editingId ? 'actualizada' : 'creada'} exitosamente`, "success");
      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarVenta = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta venta? Esta acción revertirá el stock de productos.')) {
      return;
    }

    setActionLoading(`delete-${id}`);
    
    try {
      // Obtener la venta para saber el pedido asociado
      const venta = ventas.find(v => v.id_venta === id);
      if (!venta) {
        throw new Error("Venta no encontrada");
      }

      // REVERTIR STOCK PRIMERO
      await revertirStockVenta(venta.id_pedido);

      // LUEGO ELIMINAR LA VENTA
      const { error } = await supabase.from('ventas').delete().eq('id_venta', id);
      if (error) throw error;
      
      showMessage("Venta eliminada exitosamente. Stock revertido.", "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al eliminar venta: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setForm({ descripcion: '', id_pedido: '', monto_total: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const resetFiltros = () => {
    setSearchTerm("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
    setFiltroMontoMin("");
    setFiltroMontoMax("");
  };

  // CÁLCULOS Y FILTROS
  const getPedidoDetalle = (id_pedido) => {
    const pedido = pedidos.find(p => p.id_pedido === id_pedido);
    if (!pedido) return 'N/A';
    
    const mesa = mesas.find(m => m.nromesa === pedido.nromesa);
    const salon = mesa ? `Salón ${mesa.salon}` : '';
    
    return `Pedido #${pedido.id_pedido} - Mesa ${pedido.nromesa} ${salon}`;
  };

  const getEmpleadoPedido = (id_pedido) => {
    const pedido = pedidos.find(p => p.id_pedido === id_pedido);
    if (!pedido) return 'N/A';
    
    const empleado = empleados.find(e => e.ci === pedido.ci);
    return empleado ? `${empleado.nombre} ${empleado.pat}` : 'N/A';
  };

  const getDetalleProductos = (id_pedido) => {
    const productosPedido = pedidoProductos.filter(pp => pp.id_pedido === id_pedido);
    if (productosPedido.length === 0) return 'Sin productos';
    
    const detalles = productosPedido.slice(0, 3).map(pp => {
      const producto = productos.find(p => p.id_producto === pp.id_producto);
      return producto ? `${producto.nombre} (x${pp.cantidad})` : `Producto #${pp.id_producto}`;
    });
    
    const texto = detalles.join(', ');
    return productosPedido.length > 3 ? `${texto}...` : texto;
  };

  const getTotalProductos = (id_pedido) => {
    return pedidoProductos.filter(pp => pp.id_pedido === id_pedido).length;
  };

  // CALCULAR MONTO TOTAL REAL DEL PEDIDO
  const calcularMontoRealPedido = (id_pedido) => {
    const productosPedido = pedidoProductos.filter(pp => pp.id_pedido === id_pedido);
    return productosPedido.reduce((total, pp) => total + pp.subtotal, 0);
  };

  // FILTRADO MEJORADO
  const filteredVentas = ventas.filter(venta => {
    const matchesSearch = 
      venta.id_venta.toString().includes(searchTerm) ||
      venta.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.id_pedido.toString().includes(searchTerm);

    // Filtro por fecha
    let matchesFecha = true;
    if (filtroFechaInicio || filtroFechaFin) {
      const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0];
      
      if (filtroFechaInicio && fechaVenta < filtroFechaInicio) {
        matchesFecha = false;
      }
      if (filtroFechaFin && fechaVenta > filtroFechaFin) {
        matchesFecha = false;
      }
    }

    // Filtro por monto
    let matchesMonto = true;
    if (filtroMontoMin && venta.monto_total < parseFloat(filtroMontoMin)) {
      matchesMonto = false;
    }
    if (filtroMontoMax && venta.monto_total > parseFloat(filtroMontoMax)) {
      matchesMonto = false;
    }

    return matchesSearch && matchesFecha && matchesMonto;
  });

  // ESTADÍSTICAS MEJORADAS
  const estadisticas = {
    totalVentas: ventas.reduce((sum, venta) => sum + (venta.monto_total || 0), 0),
    ventasHoy: ventas.filter(v => {
      const hoy = new Date().toISOString().split('T')[0];
      return v.fecha?.split('T')[0] === hoy;
    }).reduce((sum, venta) => sum + (venta.monto_total || 0), 0),
    totalRegistros: ventas.length,
    promedioVenta: ventas.length > 0 ? 
      ventas.reduce((sum, venta) => sum + (venta.monto_total || 0), 0) / ventas.length : 0,
    ventasMes: ventas.filter(v => {
      const mesActual = new Date().getMonth();
      const anioActual = new Date().getFullYear();
      const fechaVenta = new Date(v.fecha);
      return fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === anioActual;
    }).reduce((sum, venta) => sum + (venta.monto_total || 0), 0),
    productosVendidos: ventas.reduce((total, venta) => {
      const productosVenta = getProductosDelPedido(venta.id_pedido);
      return total + productosVenta.reduce((sum, p) => sum + p.cantidad, 0);
    }, 0)
  };

  // EXPORTAR DATOS
  const exportarDatos = () => {
    const datosExportar = filteredVentas.map(venta => ({
      ID: venta.id_venta,
      Fecha: new Date(venta.fecha).toLocaleString('es-BO'),
      Pedido: venta.id_pedido,
      Descripción: venta.descripcion || '',
      'Monto Total': `Bs ${venta.monto_total.toFixed(2)}`,
      'Detalle Pedido': getPedidoDetalle(venta.id_pedido),
      'Empleado': getEmpleadoPedido(venta.id_pedido),
      'Productos': getDetalleProductos(venta.id_pedido)
    }));

    const csvContent = [
      Object.keys(datosExportar[0]).join(','),
      ...datosExportar.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showMessage("Datos exportados exitosamente", "success");
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "60px 20px", 
        color: "#7a3b06" 
      }}>
        <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
        <p>Cargando ventas...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <TrendingUp size={32} style={{ color: "#7a3b06", marginTop: "4px" }} />
            <div>
              <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
                Gestión de Ventas
              </h1>
              <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9, margin: 0 }}>
                Administra el historial de ventas y reportes financieros
              </p>
            </div>
          </div>
          <button 
            onClick={cargarDatos}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor: "#6d4611",
              color: "white"
            }}
            disabled={loading}
          >
            <RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            Actualizar
          </button>
        </div>
      </header>

      {/* Alertas */}
      {error && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          backgroundColor: "#fee",
          border: "1px solid #f5c6cb",
          color: "#721c24"
        }}>
          <AlertTriangle size={20} />
          <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
          <button 
            onClick={() => setError("")} 
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.7
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          backgroundColor: "#f0fff4",
          border: "1px solid #c3e6cb",
          color: "#155724"
        }}>
          <CheckCircle size={20} />
          <span>{success}</span>
          <button 
            onClick={() => setSuccess("")} 
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.7
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Estadísticas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {[
          { 
            label: "Total Ventas", 
            value: estadisticas.totalVentas, 
            icon: DollarSign, 
            color: "#e3f2fd", 
            iconColor: "#1976d2",
            format: "currency"
          },
          { 
            label: "Ventas Hoy", 
            value: estadisticas.ventasHoy, 
            icon: Calendar, 
            color: "#e8f5e8", 
            iconColor: "#28a745",
            format: "currency"
          },
          { 
            label: "Ventas Mes", 
            value: estadisticas.ventasMes, 
            icon: BarChart3, 
            color: "#f3e5f5", 
            iconColor: "#7b1fa2",
            format: "currency"
          },
          { 
            label: "Promedio/Venta", 
            value: estadisticas.promedioVenta, 
            icon: TrendingUp, 
            color: "#fff3cd", 
            iconColor: "#856404",
            format: "currency"
          },
          { 
            label: "Total Registros", 
            value: estadisticas.totalRegistros, 
            icon: Receipt, 
            color: "#e0f2f1", 
            iconColor: "#00796b",
            format: "number"
          },
          { 
            label: "Productos Vendidos", 
            value: estadisticas.productosVendidos, 
            icon: Package, 
            color: "#fff0f5", 
            iconColor: "#c2185b",
            format: "number"
          }
        ].map((stat, index) => (
          <div key={index} style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e9d8b5",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{
              background: stat.color,
              padding: "12px",
              borderRadius: "8px",
              color: stat.iconColor
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#7a3b06"
              }}>
                {stat.format === "currency" ? 
                  new Intl.NumberFormat('es-BO', { 
                    style: 'currency', 
                    currency: 'BOB' 
                  }).format(stat.value) : stat.value.toLocaleString()}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#6d4611",
                opacity: 0.8
              }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "300px" }}>
            <Search size={18} style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6d4611"
            }} />
            <input
              type="text"
              placeholder="Buscar por ID, descripción o número de pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: "1px solid #e9d8b5",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
          </div>

          <button 
            onClick={() => setShowFiltros(!showFiltros)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor: "transparent",
              border: "1px solid #e9d8b5",
              color: "#6d4611"
            }}
          >
            <Filter size={16} />
            Filtros
            {showFiltros ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button 
            onClick={exportarDatos}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor: "#28a745",
              color: "white"
            }}
            disabled={filteredVentas.length === 0}
          >
            <Download size={16} />
            Exportar
          </button>

          <button 
            onClick={resetFiltros}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor: "#6c757d",
              color: "white"
            }}
          >
            <X size={16} />
            Limpiar
          </button>
        </div>

        {/* Filtros avanzados */}
        {showFiltros && (
          <div style={{
            padding: "20px",
            background: "#f8f5ee",
            borderRadius: "8px",
            border: "1px solid #e9d8b5"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px"
            }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500",
                  fontSize: "12px"
                }}>
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500",
                  fontSize: "12px"
                }}>
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500",
                  fontSize: "12px"
                }}>
                  Monto Mínimo
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={filtroMontoMin}
                  onChange={(e) => setFiltroMontoMin(e.target.value)}
                  min="0"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500",
                  fontSize: "12px"
                }}>
                  Monto Máximo
                </label>
                <input
                  type="number"
                  placeholder="10000.00"
                  value={filtroMontoMax}
                  onChange={(e) => setFiltroMontoMax(e.target.value)}
                  min="0"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            backgroundColor: "#7a3b06",
            color: "white"
          }}
        >
          <Plus size={16} />
          Nueva Venta
        </button>
      </div>

      {/* Tabla de ventas */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e9d8b5",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "20px",
          borderBottom: "1px solid #e9d8b5",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "#f8f5ee"
        }}>
          <Receipt size={20} style={{ color: "#7a3b06" }} />
          <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "18px", flex: 1 }}>
            Historial de Ventas ({filteredVentas.length})
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f5ee" }}>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>ID</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Fecha</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Pedido</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Empleado</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Productos</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Descripción</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "right" }}>Monto Total</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVentas.map(venta => (
                <tr key={venta.id_venta}>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    <strong style={{ color: "#7a3b06" }}>#{venta.id_venta}</strong>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    {venta.fecha ? new Date(venta.fecha).toLocaleString('es-BO') : 'N/A'}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    <div>
                      <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                        {getPedidoDetalle(venta.id_pedido)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                        {getTotalProductos(venta.id_pedido)} productos
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    {getEmpleadoPedido(venta.id_pedido)}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", maxWidth: "200px" }}>
                    <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      {getDetalleProductos(venta.id_pedido)}
                    </div>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    {venta.descripcion ? (
                      <div style={{ maxWidth: "200px" }}>
                        {venta.descripcion}
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#6d4611", opacity: 0.7, fontStyle: "italic" }}>
                        Sin descripción
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#28a745", fontWeight: "600", textAlign: "right" }}>
                    {new Intl.NumberFormat('es-BO', { 
                      style: 'currency', 
                      currency: 'BOB' 
                    }).format(venta.monto_total || 0)}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", width: "120px" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button
                        onClick={() => {
                          setForm({
                            descripcion: venta.descripcion || '',
                            id_pedido: venta.id_pedido.toString(),
                            monto_total: venta.monto_total.toString()
                          });
                          setEditingId(venta.id_venta);
                          setShowForm(true);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "6px 8px",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: "#ffc107",
                          color: "#7a3b06"
                        }}
                        title="Editar venta"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => eliminarVenta(venta.id_venta)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "6px 8px",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: "#dc3545",
                          color: "white"
                        }}
                        disabled={actionLoading === `delete-${venta.id_venta}`}
                        title="Eliminar venta"
                      >
                        {actionLoading === `delete-${venta.id_venta}` ? (
                          <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVentas.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
              <Receipt size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <p>No se encontraron ventas</p>
              <button 
                onClick={resetFiltros}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7a3b06",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginTop: "12px"
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e9d8b5",
            maxWidth: "500px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ color: "#7a3b06", marginBottom: "20px", fontSize: "20px" }}>
              {editingId ? "Editar Venta" : "Nueva Venta"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Pedido *
                </label>
                <select
                  value={form.id_pedido}
                  onChange={(e) => {
                    const pedidoSeleccionado = e.target.value;
                    setForm({...form, id_pedido: pedidoSeleccionado});
                    
                    // Calcular monto automáticamente cuando se selecciona un pedido
                    if (pedidoSeleccionado && !editingId) {
                      const montoReal = calcularMontoRealPedido(parseInt(pedidoSeleccionado));
                      setForm(prev => ({...prev, monto_total: montoReal.toString()}));
                    }
                  }}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">Seleccionar pedido</option>
                  {pedidos
                    .filter(pedido => !ventas.find(v => v.id_pedido === pedido.id_pedido && v.id_venta !== editingId))
                    .map(pedido => (
                    <option key={pedido.id_pedido} value={pedido.id_pedido}>
                      Pedido #{pedido.id_pedido} - Mesa {pedido.nromesa || 'N/A'} - Bs {calcularMontoRealPedido(pedido.id_pedido).toFixed(2)}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.7, marginTop: "4px" }}>
                  Solo se muestran pedidos sin venta asociada
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Monto Total (Bs) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monto_total}
                  onChange={(e) => setForm({...form, monto_total: e.target.value})}
                  required
                  min="0.01"
                  max="100000"
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
                <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.7, marginTop: "4px" }}>
                  Monto mínimo: Bs 0.01 - Máximo: Bs 100,000
                </div>
              </div>
              
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  placeholder="Descripción opcional de la venta..."
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button 
                  type="submit" 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    backgroundColor: "#28a745",
                    color: "white",
                    flex: 1
                  }}
                  disabled={actionLoading === 'guardar'}
                >
                  {actionLoading === 'guardar' ? (
                    <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingId ? "Actualizar" : "Crear Venta"}
                </button>
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    backgroundColor: "#6c757d",
                    color: "white"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}