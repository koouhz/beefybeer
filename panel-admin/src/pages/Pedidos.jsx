// src/pages/Pedidos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { InventarioService } from "../services/inventarioService";
import { 
  Edit, 
  Trash2, 
  Plus, 
  ShoppingCart, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Package,
  Utensils,
  User,
  Calendar,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Eye,
  Printer,
  ShoppingBag
} from "lucide-react";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoProductos, setPedidoProductos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showProductos, setShowProductos] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);

  const [form, setForm] = useState({
    nromesa: '',
    ci: '',
    estado: 'pendiente',
    detalle: ''
  });

  // Estados para gestión de productos
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);

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
      
      // Cargar todos los datos necesarios
      const [
        pedidosRes, 
        pedidoProductosRes, 
        productosRes,
        empleadosRes,
        mesasRes,
        ventasRes
      ] = await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('pedido_producto').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('empleados').select('ci, nombre, pat, mat'),
        supabase.from('mesas').select('nromesa, salon, capacidad, estado'),
        supabase.from('ventas').select('*')
      ]);
      
      const errors = [
        pedidosRes.error, pedidoProductosRes.error, productosRes.error, 
        empleadosRes.error, mesasRes.error, ventasRes.error
      ].filter(error => error);

      if (errors.length > 0) {
        throw new Error(`Errores al cargar: ${errors.map(e => e.message).join(', ')}`);
      }
      
      // Ordenar pedidos por ID de forma descendente (más recientes primero)
      const pedidosOrdenados = (pedidosRes.data || []).sort((a, b) => b.id_pedido - a.id_pedido);
      
      setPedidos(pedidosOrdenados);
      setPedidoProductos(pedidoProductosRes.data || []);
      setProductos(productosRes.data || []);
      setEmpleados(empleadosRes.data || []);
      setMesas(mesasRes.data || []);
      setVentas(ventasRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // OBTENER PRODUCTOS DE UN PEDIDO
  const getProductosDelPedido = (idPedido) => {
    return pedidoProductos.filter(pp => pp.id_pedido === idPedido);
  };

  // CALCULAR MONTO TOTAL DE UN PEDIDO
  const calcularMontoTotal = (idPedido) => {
    const productosPedido = getProductosDelPedido(idPedido);
    return productosPedido.reduce((total, pp) => total + pp.subtotal, 0);
  };

  // VERIFICAR STOCK DISPONIBLE
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

  // ACTUALIZAR STOCK AL MARCAR COMO PAGADO
  const actualizarStockVenta = async (idPedido) => {
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
        "venta_pedido",
        `Venta - Pedido #${idPedido}`
      );

      return resultado;
    } catch (error) {
      console.error('Error actualizando stock:', error);
      throw error;
    }
  };

  // CREAR VENTA AUTOMÁTICA AL MARCAR COMO PAGADO
  const crearVentaDesdePedido = async (pedido) => {
    try {
      const montoTotal = calcularMontoTotal(pedido.id_pedido);
      
      // Verificar si ya existe una venta para este pedido
      const ventaExistente = ventas.find(v => v.id_pedido === pedido.id_pedido);
      if (ventaExistente) {
        throw new Error("Este pedido ya tiene una venta asociada");
      }

      // Verificar stock antes de proceder
      const verificacionStock = await verificarStockDisponible(pedido.id_pedido);
      
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

      // Crear la venta
      const ventaData = {
        id_pedido: pedido.id_pedido,
        monto_total: montoTotal,
        descripcion: `Venta automática - Pedido #${pedido.id_pedido}`,
        fecha: new Date().toISOString()
      };

      const { data: nuevaVenta, error: ventaError } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select();

      if (ventaError) throw ventaError;

      // Actualizar stock
      await actualizarStockVenta(pedido.id_pedido);

      return nuevaVenta[0];
    } catch (error) {
      console.error('Error creando venta:', error);
      throw error;
    }
  };

  // CAMBIAR ESTADO DEL PEDIDO
  const cambiarEstadoPedido = async (idPedido, nuevoEstado) => {
    setActionLoading(`estado-${idPedido}`);
    
    try {
      const pedido = pedidos.find(p => p.id_pedido === idPedido);
      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      // Si se está marcando como "pagado", crear venta y actualizar stock
      if (nuevoEstado === 'pagado' && pedido.estado !== 'pagado') {
        await crearVentaDesdePedido(pedido);
      }

      // Si se está cambiando de "pagado" a otro estado, revertir la venta y stock
      if (pedido.estado === 'pagado' && nuevoEstado !== 'pagado') {
        // Buscar y eliminar la venta asociada
        const ventaAsociada = ventas.find(v => v.id_pedido === idPedido);
        if (ventaAsociada) {
          await supabase.from('ventas').delete().eq('id_venta', ventaAsociada.id_venta);
          
          // Revertir stock (sumar las cantidades)
          const productosPedido = getProductosDelPedido(idPedido);
          const movimientos = productosPedido.map(producto => ({
            id_producto: producto.id_producto,
            cantidad: producto.cantidad, // Positivo porque es entrada (reversión)
            producto: productos.find(p => p.id_producto === producto.id_producto)
          }));

          await InventarioService.actualizarStockMultiple(
            movimientos,
            'reversion_pedido',
            `Reversión Pedido #${idPedido}`
          );
        }
      }

      // Actualizar el estado del pedido
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id_pedido', idPedido);

      if (error) throw error;

      showMessage(`Pedido ${nuevoEstado === 'pagado' ? 'marcado como pagado y venta registrada' : `actualizado a ${nuevoEstado}`}`, "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al cambiar estado: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // AGREGAR PRODUCTO AL PEDIDO
  const agregarProductoAlPedido = async (idPedido, idProducto, cantidad) => {
    try {
      const producto = productos.find(p => p.id_producto === parseInt(idProducto));
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      const subtotal = producto.precio * cantidad;

      const { data, error } = await supabase
        .from('pedido_producto')
        .insert([
          {
            id_pedido: idPedido,
            id_producto: parseInt(idProducto),
            cantidad: cantidad,
            subtotal: subtotal
          }
        ])
        .select();

      if (error) throw error;

      return data[0];
    } catch (error) {
      console.error('Error agregando producto:', error);
      throw error;
    }
  };

  // ELIMINAR PRODUCTO DEL PEDIDO
  const eliminarProductoDelPedido = async (idPedidoProducto) => {
    try {
      const { error } = await supabase
        .from('pedido_producto')
        .delete()
        .eq('id_pedido_producto', idPedidoProducto);

      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  };

  // ADMINISTRAR PRODUCTOS DEL PEDIDO
  const administrarProductos = async () => {
    if (!productoSeleccionado || cantidadProducto < 1) {
      showMessage("Selecciona un producto y una cantidad válida");
      return;
    }

    setActionLoading('agregar-producto');
    
    try {
      await agregarProductoAlPedido(
        pedidoSeleccionado.id_pedido,
        productoSeleccionado,
        cantidadProducto
      );

      showMessage("Producto agregado al pedido exitosamente", "success");
      setProductoSeleccionado('');
      setCantidadProducto(1);
      cargarDatos();
    } catch (error) {
      showMessage(`Error al agregar producto: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('guardar');
    
    try {
      const pedidoData = {
        nromesa: parseInt(form.nromesa),
        ci: form.ci,
        estado: form.estado,
        detalle: form.detalle || null
      };

      let result;
      if (editingId) {
        result = await supabase
          .from('pedidos')
          .update(pedidoData)
          .eq('id_pedido', editingId);
      } else {
        result = await supabase
          .from('pedidos')
          .insert([pedidoData])
          .select();
      }
      
      if (result.error) throw result.error;

      showMessage(`Pedido ${editingId ? 'actualizado' : 'creado'} exitosamente`, "success");
      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este pedido? También se eliminarán los productos asociados.')) {
      return;
    }

    setActionLoading(`delete-${id}`);
    
    try {
      // Verificar si el pedido tiene una venta asociada
      const ventaAsociada = ventas.find(v => v.id_pedido === id);
      if (ventaAsociada) {
        throw new Error("No se puede eliminar un pedido con venta asociada. Primero elimine la venta.");
      }

      // Eliminar primero los productos del pedido
      const { error: productosError } = await supabase
        .from('pedido_producto')
        .delete()
        .eq('id_pedido', id);

      if (productosError) throw productosError;

      // Luego eliminar el pedido
      const { error } = await supabase.from('pedidos').delete().eq('id_pedido', id);
      if (error) throw error;
      
      showMessage("Pedido eliminado exitosamente", "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al eliminar pedido: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setForm({ nromesa: '', ci: '', estado: 'pendiente', detalle: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const resetFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("");
  };

  // CÁLCULOS Y FILTROS
  const getMesaDetalle = (nromesa) => {
    const mesa = mesas.find(m => m.nromesa === nromesa);
    if (!mesa) return `Mesa ${nromesa}`;
    
    return `Mesa ${nromesa} - Salón ${mesa.salon} (Capacidad: ${mesa.capacidad})`;
  };

  const getEmpleadoNombre = (ci) => {
    const empleado = empleados.find(e => e.ci === ci);
    return empleado ? `${empleado.nombre} ${empleado.pat}` : 'N/A';
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { color: '#ffc107', bgColor: '#fff3cd', icon: Clock },
      preparacion: { color: '#17a2b8', bgColor: '#d1ecf1', icon: Package },
      listo: { color: '#28a745', bgColor: '#d4edda', icon: CheckCircle },
      pagado: { color: '#6f42c1', bgColor: '#e2d9f3', icon: DollarSign },
      cancelado: { color: '#dc3545', bgColor: '#f8d7da', icon: XCircle }
    };
    
    const config = estados[estado] || estados.pendiente;
    const IconComponent = config.icon;
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}20`
      }}>
        <IconComponent size={12} />
        {estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Sin estado'}
      </span>
    );
  };

  const getDetalleProductos = (id_pedido) => {
    const productosPedido = getProductosDelPedido(id_pedido);
    if (productosPedido.length === 0) return 'Sin productos';
    
    const detalles = productosPedido.slice(0, 2).map(pp => {
      const producto = productos.find(p => p.id_producto === pp.id_producto);
      return producto ? `${producto.nombre} (x${pp.cantidad})` : `Producto #${pp.id_producto}`;
    });
    
    const texto = detalles.join(', ');
    return productosPedido.length > 2 ? `${texto}...` : texto;
  };

  // FILTRADO MEJORADO
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = 
      pedido.id_pedido.toString().includes(searchTerm) ||
      pedido.nromesa.toString().includes(searchTerm) ||
      getEmpleadoNombre(pedido.ci).toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.detalle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = !filtroEstado || pedido.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  // ESTADÍSTICAS
  const estadisticas = {
    totalPedidos: pedidos.length,
    pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
    enPreparacion: pedidos.filter(p => p.estado === 'preparacion').length,
    listos: pedidos.filter(p => p.estado === 'listo').length,
    pagados: pedidos.filter(p => p.estado === 'pagado').length,
    totalVendido: pedidos
      .filter(p => p.estado === 'pagado')
      .reduce((total, pedido) => total + calcularMontoTotal(pedido.id_pedido), 0)
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
        <p>Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <ShoppingCart size={32} style={{ color: "#7a3b06", marginTop: "4px" }} />
            <div>
              <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
                Gestión de Pedidos
              </h1>
              <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9, margin: 0 }}>
                Administra los pedidos del restaurante
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
          <XCircle size={20} />
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
            label: "Total Pedidos", 
            value: estadisticas.totalPedidos, 
            icon: ShoppingCart, 
            color: "#e3f2fd", 
            iconColor: "#1976d2"
          },
          { 
            label: "Pendientes", 
            value: estadisticas.pendientes, 
            icon: Clock, 
            color: "#fff3cd", 
            iconColor: "#856404"
          },
          { 
            label: "En Preparación", 
            value: estadisticas.enPreparacion, 
            icon: Package, 
            color: "#d1ecf1", 
            iconColor: "#0c5460"
          },
          { 
            label: "Listos", 
            value: estadisticas.listos, 
            icon: CheckCircle, 
            color: "#d4edda", 
            iconColor: "#155724"
          },
          { 
            label: "Pagados", 
            value: estadisticas.pagados, 
            icon: DollarSign, 
            color: "#e2d9f3", 
            iconColor: "#6f42c1"
          },
          { 
            label: "Total Vendido", 
            value: estadisticas.totalVendido, 
            icon: DollarSign, 
            color: "#e8f5e8", 
            iconColor: "#28a745",
            format: "currency"
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
                  }).format(stat.value) : stat.value}
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
              placeholder="Buscar por ID, mesa, empleado..."
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
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="preparacion">En preparación</option>
                  <option value="listo">Listo</option>
                  <option value="pagado">Pagado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
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
          Nuevo Pedido
        </button>
      </div>

      {/* Tabla de pedidos */}
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
          <ShoppingCart size={20} style={{ color: "#7a3b06" }} />
          <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "18px", flex: 1 }}>
            Lista de Pedidos ({filteredPedidos.length})
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f5ee" }}>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>ID</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Mesa</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Empleado</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Productos</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Detalle</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "right" }}>Total</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Estado</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.map(pedido => (
                <tr key={pedido.id_pedido}>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    <strong style={{ color: "#7a3b06" }}>#{pedido.id_pedido}</strong>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    {getMesaDetalle(pedido.nromesa)}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    {getEmpleadoNombre(pedido.ci)}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", maxWidth: "200px" }}>
                    <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      {getDetalleProductos(pedido.id_pedido)}
                    </div>
                    <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                      <button 
                        onClick={() => {
                          setPedidoSeleccionado(pedido);
                          setShowDetalle(true);
                        }}
                        style={{
                          padding: "2px 6px",
                          fontSize: "10px",
                          backgroundColor: "transparent",
                          border: "1px solid #7a3b06",
                          borderRadius: "4px",
                          color: "#7a3b06",
                          cursor: "pointer"
                        }}
                      >
                        Ver detalles
                      </button>
                      <button 
                        onClick={() => {
                          setPedidoSeleccionado(pedido);
                          setShowProductos(true);
                        }}
                        style={{
                          padding: "2px 6px",
                          fontSize: "10px",
                          backgroundColor: "#7a3b06",
                          border: "1px solid #7a3b06",
                          borderRadius: "4px",
                          color: "white",
                          cursor: "pointer"
                        }}
                      >
                        Administrar
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                    {pedido.detalle ? (
                      <div style={{ maxWidth: "150px", fontSize: "12px" }}>
                        {pedido.detalle}
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#6d4611", opacity: 0.7, fontStyle: "italic" }}>
                        Sin detalle
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#28a745", fontWeight: "600", textAlign: "right" }}>
                    {new Intl.NumberFormat('es-BO', { 
                      style: 'currency', 
                      currency: 'BOB' 
                    }).format(calcularMontoTotal(pedido.id_pedido))}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", width: "140px" }}>
                    {getEstadoBadge(pedido.estado)}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", width: "200px" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                      {/* Botones de cambio de estado */}
                      {pedido.estado !== 'pagado' && (
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id_pedido, 'pagado')}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 8px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            backgroundColor: "#28a745",
                            color: "white"
                          }}
                          disabled={actionLoading === `estado-${pedido.id_pedido}`}
                          title="Marcar como pagado"
                        >
                          {actionLoading === `estado-${pedido.id_pedido}` ? (
                            <Loader size={10} style={{ animation: "spin 1s linear infinite" }} />
                          ) : (
                            <DollarSign size={10} />
                          )}
                          Pagar
                        </button>
                      )}
                      
                      {pedido.estado !== 'preparacion' && pedido.estado !== 'pagado' && (
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id_pedido, 'preparacion')}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 8px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            backgroundColor: "#17a2b8",
                            color: "white"
                          }}
                          disabled={actionLoading === `estado-${pedido.id_pedido}`}
                          title="Marcar en preparación"
                        >
                          <Package size={10} />
                          Prep.
                        </button>
                      )}
                      
                      {pedido.estado !== 'listo' && pedido.estado !== 'pagado' && (
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id_pedido, 'listo')}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 8px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            backgroundColor: "#ffc107",
                            color: "#212529"
                          }}
                          disabled={actionLoading === `estado-${pedido.id_pedido}`}
                          title="Marcar como listo"
                        >
                          <CheckCircle size={10} />
                          Listo
                        </button>
                      )}

                      {pedido.estado === 'pagado' && (
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id_pedido, 'pendiente')}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 8px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            backgroundColor: "#6c757d",
                            color: "white"
                          }}
                          disabled={actionLoading === `estado-${pedido.id_pedido}`}
                          title="Revertir a pendiente"
                        >
                          {actionLoading === `estado-${pedido.id_pedido}` ? (
                            <Loader size={10} style={{ animation: "spin 1s linear infinite" }} />
                          ) : (
                            <Clock size={10} />
                          )}
                          Revertir
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setForm({
                            nromesa: pedido.nromesa?.toString() || '',
                            ci: pedido.ci || '',
                            estado: pedido.estado || 'pendiente',
                            detalle: pedido.detalle || ''
                          });
                          setEditingId(pedido.id_pedido);
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
                        title="Editar pedido"
                      >
                        <Edit size={12} />
                      </button>
                      
                      <button
                        onClick={() => eliminarPedido(pedido.id_pedido)}
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
                        disabled={actionLoading === `delete-${pedido.id_pedido}`}
                        title="Eliminar pedido"
                      >
                        {actionLoading === `delete-${pedido.id_pedido}` ? (
                          <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPedidos.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
              <ShoppingCart size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <p>No se encontraron pedidos</p>
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
              {editingId ? "Editar Pedido" : "Nuevo Pedido"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Mesa *
                </label>
                <select
                  value={form.nromesa}
                  onChange={(e) => setForm({...form, nromesa: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">Seleccionar mesa</option>
                  {mesas.map(mesa => (
                    <option key={mesa.nromesa} value={mesa.nromesa}>
                      Mesa {mesa.nromesa} - Salón {mesa.salon} (Capacidad: {mesa.capacidad})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Empleado *
                </label>
                <select
                  value={form.ci}
                  onChange={(e) => setForm({...form, ci: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map(empleado => (
                    <option key={empleado.ci} value={empleado.ci}>
                      {empleado.nombre} {empleado.pat} {empleado.mat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({...form, estado: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="preparacion">En preparación</option>
                  <option value="listo">Listo</option>
                  <option value="pagado">Pagado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Detalle
                </label>
                <textarea
                  value={form.detalle}
                  onChange={(e) => setForm({...form, detalle: e.target.value})}
                  placeholder="Detalle del pedido..."
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
                  {editingId ? "Actualizar" : "Crear Pedido"}
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

      {/* Modal de administración de productos */}
      {showProductos && pedidoSeleccionado && (
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
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#7a3b06", margin: 0 }}>
                Administrar Productos - Pedido #{pedidoSeleccionado.id_pedido}
              </h3>
              <button 
                onClick={() => setShowProductos(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6d4611"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario para agregar productos */}
            <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8f5ee", borderRadius: "8px" }}>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Agregar Producto</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Producto
                  </label>
                  <select
                    value={productoSeleccionado}
                    onChange={(e) => setProductoSeleccionado(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(producto => (
                      <option key={producto.id_producto} value={producto.id_producto}>
                        {producto.nombre} - Bs {producto.precio}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                    min="1"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>
                <button 
                  onClick={administrarProductos}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    backgroundColor: "#28a745",
                    color: "white",
                    height: "36px"
                  }}
                  disabled={actionLoading === 'agregar-producto'}
                >
                  {actionLoading === 'agregar-producto' ? (
                    <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Plus size={16} />
                  )}
                  Agregar
                </button>
              </div>
            </div>

            {/* Lista de productos actuales */}
            <div>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Productos en el Pedido</h4>
              {getProductosDelPedido(pedidoSeleccionado.id_pedido).length === 0 ? (
                <p style={{ color: "#6d4611", opacity: 0.7, textAlign: "center", padding: "20px" }}>
                  No hay productos en este pedido
                </p>
              ) : (
                <div style={{ border: "1px solid #e9d8b5", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f5ee" }}>
                        <th style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "left", fontSize: "12px" }}>Producto</th>
                        <th style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "center", fontSize: "12px" }}>Cantidad</th>
                        <th style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "right", fontSize: "12px" }}>Precio Unit.</th>
                        <th style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "right", fontSize: "12px" }}>Subtotal</th>
                        <th style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "center", fontSize: "12px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProductosDelPedido(pedidoSeleccionado.id_pedido).map((pp, index) => {
                        const producto = productos.find(p => p.id_producto === pp.id_producto);
                        return (
                          <tr key={index}>
                            <td style={{ padding: "12px", border: "1px solid #e9d8b5", fontSize: "14px" }}>
                              {producto ? producto.nombre : `Producto #${pp.id_producto}`}
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "center", fontSize: "14px" }}>
                              {pp.cantidad}
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "right", fontSize: "14px" }}>
                              {new Intl.NumberFormat('es-BO', { 
                                style: 'currency', 
                                currency: 'BOB' 
                              }).format(producto ? producto.precio : 0)}
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "right", fontSize: "14px", fontWeight: "600" }}>
                              {new Intl.NumberFormat('es-BO', { 
                                style: 'currency', 
                                currency: 'BOB' 
                              }).format(pp.subtotal)}
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "center", fontSize: "14px" }}>
                              <button
                                onClick={async () => {
                                  if (window.confirm('¿Estás seguro de eliminar este producto del pedido?')) {
                                    try {
                                      await eliminarProductoDelPedido(pp.id_pedido_producto);
                                      showMessage("Producto eliminado del pedido", "success");
                                      cargarDatos();
                                    } catch (error) {
                                      showMessage(`Error al eliminar producto: ${error.message}`);
                                    }
                                  }
                                }}
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
                                title="Eliminar producto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: "#f8f5ee" }}>
                        <td colSpan="3" style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "right", fontWeight: "bold" }}>
                          Total del Pedido:
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", textAlign: "right", fontWeight: "bold", color: "#28a745" }}>
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(calcularMontoTotal(pedidoSeleccionado.id_pedido))}
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5" }}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de productos */}
      {showDetalle && pedidoSeleccionado && (
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
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#7a3b06", margin: 0 }}>
                Detalles del Pedido #{pedidoSeleccionado.id_pedido}
              </h3>
              <button 
                onClick={() => setShowDetalle(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6d4611"
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <strong>Mesa:</strong> {getMesaDetalle(pedidoSeleccionado.nromesa)}<br />
              <strong>Empleado:</strong> {getEmpleadoNombre(pedidoSeleccionado.ci)}<br />
              <strong>Estado:</strong> {getEstadoBadge(pedidoSeleccionado.estado)}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#7a3b06", marginBottom: "12px" }}>Productos:</h4>
              {getProductosDelPedido(pedidoSeleccionado.id_pedido).length === 0 ? (
                <p style={{ color: "#6d4611", opacity: 0.7 }}>No hay productos en este pedido</p>
              ) : (
                <div style={{ border: "1px solid #e9d8b5", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f5ee" }}>
                        <th style={{ padding: "8px", border: "1px solid #e9d8b5", textAlign: "left", fontSize: "12px" }}>Producto</th>
                        <th style={{ padding: "8px", border: "1px solid #e9d8b5", textAlign: "center", fontSize: "12px" }}>Cantidad</th>
                        <th style={{ padding: "8px", border: "1px solid #e9d8b5", textAlign: "right", fontSize: "12px" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProductosDelPedido(pedidoSeleccionado.id_pedido).map((pp, index) => {
                        const producto = productos.find(p => p.id_producto === pp.id_producto);
                        return (
                          <tr key={index}>
                            <td style={{ padding: "8px", border: "1px solid #e9d8b5", fontSize: "12px" }}>
                              {producto ? producto.nombre : `Producto #${pp.id_producto}`}
                            </td>
                            <td style={{ padding: "8px", border: "1px solid #e9d8b5", textAlign: "center", fontSize: "12px" }}>
                              {pp.cantidad}
                            </td>
                            <td style={{ padding: "8px", border: "1px solid #e9d8b5", textAlign: "right", fontSize: "12px" }}>
                              {new Intl.NumberFormat('es-BO', { 
                                style: 'currency', 
                                currency: 'BOB' 
                              }).format(pp.subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: "#f8f5ee" }}>
                        <td colSpan="2" style={{ padding: "8px", border: "1px solid #e9d8b5", textAlign: "right", fontWeight: "bold" }}>
                          Total:
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #e9d8b5", textAlign: "right", fontWeight: "bold", color: "#28a745" }}>
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(calcularMontoTotal(pedidoSeleccionado.id_pedido))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {pedidoSeleccionado.detalle && (
              <div>
                <h4 style={{ color: "#7a3b06", marginBottom: "8px" }}>Detalle:</h4>
                <p style={{ color: "#6d4611", padding: "8px", backgroundColor: "#f8f5ee", borderRadius: "4px" }}>
                  {pedidoSeleccionado.detalle}
                </p>
              </div>
            )}
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

