// src/pages/Pedidos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  ShoppingCart, 
  Search,
  Users,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Loader,
  Eye,
  PlusCircle,
  MinusCircle,
  Calculator,
  RefreshCw,
  CreditCard,
  Ban,
  Clock4
} from "lucide-react";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidoProductos, setPedidoProductos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [showProductosForm, setShowProductosForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [viewMode, setViewMode] = useState("lista");
  const [modoEdicionProductos, setModoEdicionProductos] = useState(false);

  const [form, setForm] = useState({
    detalle: '',
    nromesa: '',
    ci: '',
    estado: 'pendiente'
  });

  const [productoForm, setProductoForm] = useState({
    id_producto: '',
    cantidad: 1,
    subtotal: 0
  });

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroMesa, setFiltroMesa] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para cambiar el estado de un pedido
  const cambiarEstadoPedido = async (idPedido, nuevoEstado) => {
    try {
      console.log(`🔄 Cambiando estado del pedido ${idPedido} a ${nuevoEstado}`);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id_pedido', idPedido);

      if (error) throw error;

      // Si el estado es "pagado" o "cancelado", liberar la mesa
      if (nuevoEstado === 'pagado' || nuevoEstado === 'cancelado') {
        // Obtener el pedido para saber en qué mesa está
        const { data: pedido } = await supabase
          .from('pedidos')
          .select('nromesa')
          .eq('id_pedido', idPedido)
          .single();

        if (pedido && pedido.nromesa) {
          await verificarEstadoMesa(pedido.nromesa);
        }
      }

      // Si el estado es "pagado", crear una venta
      if (nuevoEstado === 'pagado') {
        await crearVenta(idPedido);
      }

      showMessage(`Estado del pedido actualizado a ${nuevoEstado}`, "success");
      
      // Recargar los datos para reflejar los cambios
      await cargarDatos();
      
    } catch (error) {
      console.error('❌ Error cambiando estado del pedido:', error);
      showMessage(`Error al cambiar estado: ${error.message}`);
    }
  };

  // Función para crear una venta cuando el pedido se marca como pagado
  const crearVenta = async (idPedido) => {
    try {
      // Obtener el pedido completo con sus productos
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_producto (
            *,
            productos (*)
          )
        `)
        .eq('id_pedido', idPedido)
        .single();

      if (pedidoError) throw pedidoError;

      // Calcular el monto total sumando los subtotales de los productos
      const montoTotal = pedido.pedido_producto?.reduce((total, item) => {
        return total + (parseFloat(item.subtotal) || 0);
      }, 0) || 0;

      // Crear la venta
      const { error: ventaError } = await supabase
        .from('ventas')
        .insert([
          {
            id_pedido: idPedido,
            monto_total: montoTotal,
            descripcion: `Venta del pedido #${idPedido}`
          }
        ]);

      if (ventaError) throw ventaError;

      console.log(`✅ Venta creada para pedido ${idPedido} con monto: ${montoTotal}`);
      
    } catch (error) {
      console.error('❌ Error creando venta:', error);
      throw error;
    }
  };

  // Función para verificar y actualizar el estado de una mesa específica
  const verificarEstadoMesa = async (nromesa) => {
    try {
      // Obtener pedidos para esta mesa (solo los pendientes)
      const { data: pedidosMesa, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('nromesa', nromesa)
        .eq('estado', 'pendiente');

      if (pedidosError) throw pedidosError;

      const tienePedidosActivos = pedidosMesa && pedidosMesa.length > 0;
      const nuevoEstado = tienePedidosActivos ? 'ocupada' : 'libre';

      // Obtener el estado actual de la mesa
      const { data: mesaActual, error: mesaError } = await supabase
        .from('mesas')
        .select('estado')
        .eq('nromesa', nromesa)
        .single();

      if (mesaError) throw mesaError;

      // Solo actualizar si el estado ha cambiado
      if (mesaActual.estado !== nuevoEstado) {
        const { error: updateError } = await supabase
          .from('mesas')
          .update({ estado: nuevoEstado })
          .eq('nromesa', nromesa);

        if (updateError) throw updateError;

        console.log(`✅ Mesa ${nromesa} actualizada a ${nuevoEstado}`);
      }

      return mesaActual.estado;
    } catch (error) {
      console.error(`❌ Error verificando estado de mesa ${nromesa}:`, error);
    }
  };

  const showMessage = (message, type = "error") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedidosRes, mesasRes, productosRes, pedidoProductosRes, empleadosRes] = await Promise.all([
        supabase.from('pedidos').select(`
          *,
          mesas (nromesa, salon, estado),
          empleados (ci, nombre, pat, mat)
        `).order('id_pedido', { ascending: false }),
        supabase.from('mesas').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('pedido_producto').select(`
          *,
          productos (id_producto, nombre, precio, descripcion)
        `),
        supabase.from('empleados').select('ci, nombre, pat, mat')
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (mesasRes.error) throw mesasRes.error;
      if (productosRes.error) throw productosRes.error;
      if (pedidoProductosRes.error) throw pedidoProductosRes.error;
      if (empleadosRes.error) throw empleadosRes.error;

      setPedidos(pedidosRes.data || []);
      setMesas(mesasRes.data || []);
      setProductos(productosRes.data || []);
      setPedidoProductos(pedidoProductosRes.data || []);
      setEmpleados(empleadosRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validatePedido = (pedido) => {
    if (!pedido.nromesa) throw new Error("Debe seleccionar una mesa");
    if (!pedido.ci) throw new Error("Debe seleccionar un empleado");
    
    // Verificar si la mesa ya tiene un pedido activo (solo pendiente)
    const mesaConPedidoActivo = pedidos.find(p => 
      p.nromesa === parseInt(pedido.nromesa) && 
      p.id_pedido !== editingId &&
      p.estado === 'pendiente'
    );
    
    if (mesaConPedidoActivo) {
      throw new Error(`La mesa ${pedido.nromesa} ya tiene un pedido activo (Pedido #${mesaConPedidoActivo.id_pedido})`);
    }

    // Verificar estado de la mesa
    const mesaSeleccionada = mesas.find(m => m.nromesa === parseInt(pedido.nromesa));
    if (mesaSeleccionada && mesaSeleccionada.estado === 'reservada') {
      throw new Error(`La mesa ${pedido.nromesa} está reservada y no puede recibir pedidos`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validatePedido(form);

      if (editingId) {
        const { error } = await supabase
          .from('pedidos')
          .update(form)
          .eq('id_pedido', editingId);
        if (error) throw error;
        showMessage("Pedido actualizado exitosamente", "success");
      } else {
        const { error } = await supabase
          .from('pedidos')
          .insert([form]);
        if (error) throw error;
        showMessage("Pedido creado exitosamente", "success");
      }

      // Verificar estado de la mesa después de crear/actualizar pedido
      if (form.nromesa) {
        await verificarEstadoMesa(parseInt(form.nromesa));
      }

      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const editarPedido = (pedido) => {
    setForm({
      detalle: pedido.detalle || '',
      nromesa: pedido.nromesa.toString(),
      ci: pedido.ci,
      estado: pedido.estado || 'pendiente'
    });
    setEditingId(pedido.id_pedido);
    setShowForm(true);
  };

  const gestionarProductosPedido = async (pedido) => {
    try {
      // Cargar productos actuales del pedido
      const productosActuales = getProductosPedido(pedido.id_pedido).map(pp => ({
        id_pedido_producto: pp.id_pedido_producto,
        id_producto: pp.id_producto,
        cantidad: pp.cantidad,
        subtotal: pp.subtotal,
        producto: pp.productos
      }));
      
      setProductosSeleccionados(productosActuales);
      setProductosOriginales([...productosActuales]);
      setEditingId(pedido.id_pedido);
      setModoEdicionProductos(true);
      setShowProductosForm(true);
    } catch (error) {
      showMessage(`Error al cargar productos: ${error.message}`);
    }
  };

  const agregarProducto = () => {
    if (!productoForm.id_producto) {
      showMessage("Debe seleccionar un producto");
      return;
    }

    const producto = productos.find(p => p.id_producto === parseInt(productoForm.id_producto));
    if (!producto) return;

    const subtotal = producto.precio * productoForm.cantidad;
    
    const productoExistente = productosSeleccionados.findIndex(
      p => p.id_producto === parseInt(productoForm.id_producto)
    );

    if (productoExistente !== -1) {
      const nuevosProductos = [...productosSeleccionados];
      nuevosProductos[productoExistente].cantidad += productoForm.cantidad;
      nuevosProductos[productoExistente].subtotal = nuevosProductos[productoExistente].cantidad * producto.precio;
      setProductosSeleccionados(nuevosProductos);
    } else {
      setProductosSeleccionados([
        ...productosSeleccionados,
        {
          id_producto: parseInt(productoForm.id_producto),
          cantidad: productoForm.cantidad,
          subtotal: subtotal,
          producto: producto
        }
      ]);
    }

    setProductoForm({
      id_producto: '',
      cantidad: 1,
      subtotal: 0
    });
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = productosSeleccionados.filter((_, i) => i !== index);
    setProductosSeleccionados(nuevosProductos);
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos[index].cantidad = nuevaCantidad;
    nuevosProductos[index].subtotal = nuevaCantidad * nuevosProductos[index].producto.precio;
    setProductosSeleccionados(nuevosProductos);
  };

  const guardarProductosPedido = async (idPedido) => {
    try {
      if (productosSeleccionados.length === 0) {
        throw new Error("Debe agregar al menos un producto al pedido");
      }

      if (modoEdicionProductos) {
        // Modo edición: eliminar productos existentes y agregar los nuevos
        const { error: errorEliminar } = await supabase
          .from('pedido_producto')
          .delete()
          .eq('id_pedido', idPedido);

        if (errorEliminar) throw errorEliminar;
      }

      const productosData = productosSeleccionados.map(item => ({
        id_pedido: idPedido,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        subtotal: item.subtotal
      }));

      const { error } = await supabase
        .from('pedido_producto')
        .insert(productosData);

      if (error) throw error;

      showMessage(
        modoEdicionProductos ? "Productos actualizados exitosamente" : "Productos agregados al pedido exitosamente", 
        "success"
      );
      
      setProductosSeleccionados([]);
      setProductosOriginales([]);
      setModoEdicionProductos(false);
      setShowProductosForm(false);
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const cancelarEdicionProductos = () => {
    setProductosSeleccionados([...productosOriginales]);
    setProductosOriginales([]);
    setModoEdicionProductos(false);
    setShowProductosForm(false);
  };

  const eliminarPedido = async (id) => {
    // Primero obtener el pedido para saber la mesa
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('nromesa')
      .eq('id_pedido', id)
      .single();

    // Primero eliminar los productos del pedido
    const { error: errorProductos } = await supabase
      .from('pedido_producto')
      .delete()
      .eq('id_pedido', id);

    if (errorProductos) {
      showMessage(`Error eliminando productos del pedido: ${errorProductos.message}`);
      return;
    }

    // Luego eliminar el pedido
    if (window.confirm('¿Estás seguro de eliminar este pedido?')) {
      try {
        const { error } = await supabase
          .from('pedidos')
          .delete()
          .eq('id_pedido', id);
        if (error) throw error;
        showMessage("Pedido eliminado exitosamente", "success");
        
        // Verificar estado de la mesa después de eliminar
        if (pedido && pedido.nromesa) {
          await verificarEstadoMesa(pedido.nromesa);
        }
        
        cargarDatos();
      } catch (error) {
        showMessage(`Error eliminando pedido: ${error.message}`);
      }
    }
  };

  const verDetallePedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setViewMode("detalle");
  };

  const resetForm = () => {
    setForm({
      detalle: '',
      nromesa: '',
      ci: '',
      estado: 'pendiente'
    });
    setProductosSeleccionados([]);
    setProductosOriginales([]);
    setEditingId(null);
    setShowForm(false);
    setShowProductosForm(false);
    setModoEdicionProductos(false);
  };

  // Cálculos
  const calcularTotalPedido = (idPedido) => {
    const productosPedido = pedidoProductos.filter(pp => pp.id_pedido === idPedido);
    return productosPedido.reduce((total, pp) => total + pp.subtotal, 0);
  };

  const calcularTotalSeleccionados = () => {
    return productosSeleccionados.reduce((total, item) => total + item.subtotal, 0);
  };

  // Obtener mesas disponibles (sin pedidos activos pendientes)
  const getMesasDisponibles = () => {
    const mesasConPedidosActivos = pedidos
      .filter(p => p.estado === 'pendiente')
      .map(p => p.nromesa);
    
    return mesas.filter(mesa => 
      !mesasConPedidosActivos.includes(mesa.nromesa) && 
      mesa.estado !== 'reservada'
    );
  };

  // Estilos para estados de pedidos
  const getEstadoPedidoStyles = (estado) => {
    const estados = {
      pendiente: { 
        backgroundColor: "#fff3cd", 
        color: "#856404"
      },
      pagado: { 
        backgroundColor: "#e8f5e8", 
        color: "#28a745"
      },
      cancelado: { 
        backgroundColor: "#fff5f5", 
        color: "#dc3545"
      }
    };
    return estados[estado] || { 
      backgroundColor: "#f8f9fa", 
      color: "#6c757d"
    };
  };

  // Filtros
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = 
      pedido.id_pedido.toString().includes(searchTerm) ||
      pedido.detalle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.mesas?.nromesa.toString().includes(searchTerm) ||
      pedido.empleados?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMesa = filtroMesa === "todos" || pedido.nromesa.toString() === filtroMesa;
    const matchesEstado = filtroEstado === "todos" || pedido.estado === filtroEstado;

    return matchesSearch && matchesMesa && matchesEstado;
  });

  // Estadísticas
  const estadisticas = {
    totalPedidos: pedidos.length,
    pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
    pedidosPagados: pedidos.filter(p => p.estado === 'pagado').length,
    pedidosCancelados: pedidos.filter(p => p.estado === 'cancelado').length,
    totalVentas: pedidos
      .filter(p => p.estado === 'pagado')
      .reduce((total, pedido) => total + calcularTotalPedido(pedido.id_pedido), 0),
    promedioPedido: pedidos.length > 0 ? 
      pedidos.reduce((total, pedido) => total + calcularTotalPedido(pedido.id_pedido), 0) / pedidos.length : 0
  };

  const getProductosPedido = (idPedido) => {
    return pedidoProductos.filter(pp => pp.id_pedido === idPedido);
  };

  const getEmpleadoNombre = (ci) => {
    const empleado = empleados.find(e => e.ci === ci);
    return empleado ? `${empleado.nombre} ${empleado.pat}` : 'N/A';
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
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
          Gestión de Pedidos
        </h1>
        <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
          Administra los pedidos del restaurante y su relación con mesas y productos
        </p>
      </header>

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
          <span>{error}</span>
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

      {/* Vista de Detalle */}
      {viewMode === "detalle" && pedidoSeleccionado && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "20px",
            borderBottom: "1px solid #e9d8b5",
            backgroundColor: "#f8f5ee",
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            <button 
              onClick={() => setViewMode("lista")}
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
            >
              ← Volver al listado
            </button>
            <h2 style={{ color: "#7a3b06", margin: 0 }}>
              Detalle del Pedido #{pedidoSeleccionado.id_pedido}
            </h2>
          </div>
          
          <div style={{ padding: "30px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
              marginBottom: "30px"
            }}>
              <div>
                <h3 style={{ color: "#7a3b06", marginBottom: "20px" }}>Información del Pedido</h3>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #e9d8b5"
                  }}>
                    <span style={{ color: "#6d4611", fontWeight: "500" }}>Número de Pedido:</span>
                    <span style={{ color: "#7a3b06", fontWeight: "600" }}>#{pedidoSeleccionado.id_pedido}</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #e9d8b5"
                  }}>
                    <span style={{ color: "#6d4611", fontWeight: "500" }}>Mesa:</span>
                    <span style={{ color: "#7a3b06", fontWeight: "600" }}>
                      Mesa {pedidoSeleccionado.mesas?.nromesa} (Salón {pedidoSeleccionado.mesas?.salon})
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #e9d8b5"
                  }}>
                    <span style={{ color: "#6d4611", fontWeight: "500" }}>Empleado:</span>
                    <span style={{ color: "#7a3b06", fontWeight: "600" }}>
                      {getEmpleadoNombre(pedidoSeleccionado.ci)}
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #e9d8b5"
                  }}>
                    <span style={{ color: "#6d4611", fontWeight: "500" }}>Estado:</span>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "600",
                      ...getEstadoPedidoStyles(pedidoSeleccionado.estado)
                    }}>
                      {pedidoSeleccionado.estado === 'pendiente' && '⏳ Pendiente'}
                      {pedidoSeleccionado.estado === 'pagado' && '✅ Pagado'}
                      {pedidoSeleccionado.estado === 'cancelado' && '❌ Cancelado'}
                      {!pedidoSeleccionado.estado && 'No especificado'}
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #e9d8b5"
                  }}>
                    <span style={{ color: "#6d4611", fontWeight: "500" }}>Total:</span>
                    <span style={{ color: "#28a745", fontWeight: "700", fontSize: "18px" }}>
                      {new Intl.NumberFormat('es-BO', { 
                        style: 'currency', 
                        currency: 'BOB' 
                      }).format(calcularTotalPedido(pedidoSeleccionado.id_pedido))}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ color: "#7a3b06", marginBottom: "20px" }}>Detalles Adicionales</h3>
                <div style={{
                  background: "#f8f5ee",
                  padding: "20px",
                  borderRadius: "8px",
                  minHeight: "120px"
                }}>
                  {pedidoSeleccionado.detalle ? (
                    <p style={{ color: "#6d4611", lineHeight: "1.5", margin: 0 }}>
                      {pedidoSeleccionado.detalle}
                    </p>
                  ) : (
                    <p style={{ color: "#6d4611", opacity: 0.7, fontStyle: "italic", margin: 0 }}>
                      No hay detalles adicionales para este pedido
                    </p>
                  )}
                </div>

                {/* Selector de estado en el detalle */}
                <div style={{ marginTop: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#6d4611",
                    fontWeight: "500"
                  }}>
                    Cambiar Estado del Pedido
                  </label>
                  <select
                    value={pedidoSeleccionado.estado || 'pendiente'}
                    onChange={(e) => {
                      cambiarEstadoPedido(pedidoSeleccionado.id_pedido, e.target.value);
                      setPedidoSeleccionado({...pedidoSeleccionado, estado: e.target.value});
                    }}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      ...getEstadoPedidoStyles(pedidoSeleccionado.estado)
                    }}
                  >
                    <option value="pendiente">
                      ⏳ Pendiente - La mesa está ocupada
                    </option>
                    <option value="pagado">
                      ✅ Pagado - Se registra venta y libera mesa
                    </option>
                    <option value="cancelado">
                      ❌ Cancelado - No se registra venta y libera mesa
                    </option>
                  </select>
                  <div style={{ fontSize: "12px", color: "#6d4611", marginTop: "8px", opacity: 0.7 }}>
                    {pedidoSeleccionado.estado === 'pendiente' && 'El pedido está activo y ocupa la mesa'}
                    {pedidoSeleccionado.estado === 'pagado' && 'El pedido fue pagado y la mesa se liberó'}
                    {pedidoSeleccionado.estado === 'cancelado' && 'El pedido fue cancelado y la mesa se liberó'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#7a3b06", margin: 0 }}>
                  Productos del Pedido
                </h3>
                <button
                  onClick={() => gestionarProductosPedido(pedidoSeleccionado)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    backgroundColor: "#ffc107",
                    color: "#7a3b06"
                  }}
                >
                  <Edit size={16} />
                  Gestionar Productos
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8f5ee" }}>
                      <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Producto</th>
                      <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Cantidad</th>
                      <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "right" }}>Precio Unit.</th>
                      <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getProductosPedido(pedidoSeleccionado.id_pedido).map((pp, index) => (
                      <tr key={pp.id_pedido_producto}>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <div>
                            <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                              {pp.productos?.nombre}
                            </div>
                            {pp.productos?.descripcion && (
                              <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                                {pp.productos.descripcion}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", textAlign: "center" }}>
                          {pp.cantidad}
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", textAlign: "right" }}>
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(pp.productos?.precio || 0)}
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#28a745", fontWeight: "600", textAlign: "right" }}>
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(pp.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "right" }}>
                        Total:
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#28a745", fontWeight: "700", fontSize: "16px", textAlign: "right" }}>
                        {new Intl.NumberFormat('es-BO', { 
                          style: 'currency', 
                          currency: 'BOB' 
                        }).format(calcularTotalPedido(pedidoSeleccionado.id_pedido))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista Principal */}
      {viewMode === "lista" && (
        <>
          {/* Barra de búsqueda y filtros */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "24px"
          }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={18} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6d4611"
              }} />
              <input
                type="text"
                placeholder="Buscar por ID, detalle, mesa o empleado..."
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
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select 
                value={filtroMesa}
                onChange={(e) => setFiltroMesa(e.target.value)}
                style={{
                  padding: "12px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minWidth: "180px"
                }}
              >
                <option value="todos">Todas las mesas</option>
                {mesas.map(mesa => (
                  <option key={mesa.nromesa} value={mesa.nromesa}>
                    Mesa {mesa.nromesa} (Salón {mesa.salon})
                  </option>
                ))}
              </select>
              <select 
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{
                  padding: "12px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minWidth: "180px"
                }}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Dashboard de Estadísticas */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px"
          }}>
            {[
              { label: "Total Pedidos", value: estadisticas.totalPedidos, icon: ShoppingCart, color: "#e3f2fd", iconColor: "#1976d2" },
              { label: "Pendientes", value: estadisticas.pedidosPendientes, icon: Clock4, color: "#fff3cd", iconColor: "#856404" },
              { label: "Pagados", value: estadisticas.pedidosPagados, icon: CheckCircle, color: "#e8f5e8", iconColor: "#28a745" },
              { label: "Cancelados", value: estadisticas.pedidosCancelados, icon: Ban, color: "#fff5f5", iconColor: "#dc3545" },
              { label: "Total Ventas", value: estadisticas.totalVentas, icon: DollarSign, color: "#f3e5f5", iconColor: "#7b1fa2" }
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
                    {stat.label === "Total Ventas" ? 
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

          {/* Formulario principal de pedido */}
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
                      {editingId ? (
                        // Al editar, mostrar todas las mesas excepto las que tienen pedidos activos (excluyendo el actual)
                        mesas.filter(mesa => {
                          const mesaConPedidoActivo = pedidos.find(p => 
                            p.nromesa === mesa.nromesa && 
                            p.id_pedido !== editingId &&
                            p.estado === 'pendiente'
                          );
                          return !mesaConPedidoActivo && mesa.estado !== 'reservada';
                        }).map(mesa => (
                          <option key={mesa.nromesa} value={mesa.nromesa}>
                            Mesa {mesa.nromesa} - Salón {mesa.salon} ({mesa.estado})
                          </option>
                        ))
                      ) : (
                        // Al crear nuevo, solo mostrar mesas disponibles
                        getMesasDisponibles().map(mesa => (
                          <option key={mesa.nromesa} value={mesa.nromesa}>
                            Mesa {mesa.nromesa} - Salón {mesa.salon} ({mesa.estado})
                          </option>
                        ))
                      )}
                    </select>
                    <div style={{ fontSize: "12px", color: "#6d4611", marginTop: "4px", opacity: 0.8 }}>
                      {editingId 
                        ? "Solo se muestran mesas sin pedidos activos (pendientes)"
                        : "Solo se muestran mesas disponibles (sin pedidos activos y no reservadas)"
                      }
                    </div>
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
                          {empleado.nombre} {empleado.pat} - {empleado.ci}
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
                      Estado del Pedido
                    </label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm({...form, estado: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e9d8b5",
                        borderRadius: "6px",
                        fontSize: "14px",
                        ...getEstadoPedidoStyles(form.estado)
                      }}
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="pagado">✅ Pagado</option>
                      <option value="cancelado">❌ Cancelado</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "6px",
                      color: "#6d4611",
                      fontWeight: "500"
                    }}>
                      Detalles Adicionales
                    </label>
                    <textarea
                      value={form.detalle}
                      onChange={(e) => setForm({...form, detalle: e.target.value})}
                      placeholder="Observaciones o detalles del pedido..."
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
                    <button type="submit" style={{
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
                    }}>
                      <Save size={16} />
                      {editingId ? "Actualizar" : "Crear Pedido"}
                    </button>
                    <button type="button" onClick={resetForm} style={{
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
                    }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Formulario para gestionar productos */}
          {showProductosForm && (
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
              zIndex: 1001,
              padding: "20px"
            }}>
              <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9d8b5",
                maxWidth: "700px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto"
              }}>
                <h3 style={{ color: "#7a3b06", marginBottom: "20px", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <RefreshCw size={20} />
                  Gestionar Productos del Pedido
                </h3>
                
                {/* Formulario para agregar producto */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "10px",
                  marginBottom: "20px",
                  alignItems: "end"
                }}>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "6px",
                      color: "#6d4611",
                      fontWeight: "500",
                      fontSize: "12px"
                    }}>
                      Producto
                    </label>
                    <select
                      value={productoForm.id_producto}
                      onChange={(e) => setProductoForm({...productoForm, id_producto: e.target.value})}
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
                          {producto.nombre} - {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(producto.precio)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "6px",
                      color: "#6d4611",
                      fontWeight: "500",
                      fontSize: "12px"
                    }}>
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={productoForm.cantidad}
                      onChange={(e) => setProductoForm({...productoForm, cantidad: parseInt(e.target.value) || 1})}
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
                  <div>
                    <button
                      onClick={agregarProducto}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: "#28a745",
                        color: "white",
                        height: "36px"
                      }}
                    >
                      <PlusCircle size={14} />
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de productos seleccionados */}
                {productosSeleccionados.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#7a3b06", marginBottom: "10px", fontSize: "16px" }}>
                      Productos del Pedido ({productosSeleccionados.length})
                    </h4>
                    <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e9d8b5", borderRadius: "6px" }}>
                      {productosSeleccionados.map((item, index) => (
                        <div key={index} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          borderBottom: "1px solid #e9d8b5",
                          backgroundColor: index % 2 === 0 ? "#f8f5ee" : "white"
                        }}>
                          <div style={{ flex: 2 }}>
                            <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                              {item.producto.nombre}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6d4611" }}>
                              {new Intl.NumberFormat('es-BO', { 
                                style: 'currency', 
                                currency: 'BOB' 
                              }).format(item.producto.precio)} c/u
                            </div>
                          </div>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => actualizarCantidad(index, item.cantidad - 1)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#ffc107",
                                color: "#7a3b06"
                              }}
                            >
                              <MinusCircle size={16} />
                            </button>
                            <span style={{ 
                              minWidth: "40px", 
                              textAlign: "center", 
                              fontWeight: "600",
                              fontSize: "16px",
                              color: "#7a3b06"
                            }}>
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => actualizarCantidad(index, item.cantidad + 1)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#28a745",
                                color: "white"
                              }}
                            >
                              <PlusCircle size={16} />
                            </button>
                          </div>
                          <div style={{ flex: 1, textAlign: "right", fontWeight: "600", color: "#28a745", fontSize: "16px" }}>
                            {new Intl.NumberFormat('es-BO', { 
                              style: 'currency', 
                              currency: 'BOB' 
                            }).format(item.subtotal)}
                          </div>
                          <div style={{ flex: "0 0 auto", marginLeft: "10px" }}>
                            <button
                              onClick={() => eliminarProducto(index)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "8px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#dc3545",
                                color: "white"
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "15px",
                      backgroundColor: "#e8f5e8",
                      borderRadius: "0 0 6px 6px",
                      border: "1px solid #c3e6cb",
                      borderTop: "none"
                    }}>
                      <span style={{ fontWeight: "600", color: "#155724", fontSize: "16px" }}>Total:</span>
                      <span style={{ fontWeight: "700", color: "#155724", fontSize: "20px" }}>
                        {new Intl.NumberFormat('es-BO', { 
                          style: 'currency', 
                          currency: 'BOB' 
                        }).format(calcularTotalSeleccionados())}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                  <button 
                    onClick={() => guardarProductosPedido(editingId)}
                    disabled={productosSeleccionados.length === 0}
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
                      backgroundColor: productosSeleccionados.length === 0 ? "#6c757d" : "#28a745",
                      color: "white",
                      flex: 1
                    }}
                  >
                    <Save size={16} />
                    Guardar Cambios
                  </button>
                  
                  <button 
                    onClick={cancelarEdicionProductos}
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

                <div style={{
                  marginTop: "15px",
                  padding: "12px",
                  backgroundColor: "#fff3cd",
                  borderRadius: "6px",
                  border: "1px solid #ffeaa7"
                }}>
                  <div style={{ fontSize: "12px", color: "#856404", textAlign: "center" }}>
                    <strong>Gestión de productos:</strong> Puedes modificar cantidades, eliminar productos o agregar nuevos productos al pedido.
                  </div>
                </div>
              </div>
            </div>
          )}

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
                Pedidos ({filteredPedidos.length})
              </h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f5ee" }}>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>ID</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Mesa</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Empleado</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Estado</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Productos</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "right" }}>Total</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPedidos.map(pedido => {
                    const productosPedido = getProductosPedido(pedido.id_pedido);
                    const total = calcularTotalPedido(pedido.id_pedido);
                    
                    return (
                      <tr key={pedido.id_pedido}>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <strong style={{ color: "#7a3b06" }}>#{pedido.id_pedido}</strong>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <div>
                            <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                              Mesa {pedido.mesas?.nromesa}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                              Salón {pedido.mesas?.salon} • {pedido.mesas?.estado}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          {getEmpleadoNombre(pedido.ci)}
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <select
                            value={pedido.estado || 'pendiente'}
                            onChange={(e) => cambiarEstadoPedido(pedido.id_pedido, e.target.value)}
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #e9d8b5",
                              borderRadius: "6px",
                              fontSize: "14px",
                              cursor: "pointer",
                              ...getEstadoPedidoStyles(pedido.estado)
                            }}
                          >
                            <option value="pendiente">⏳ Pendiente</option>
                            <option value="pagado">✅ Pagado</option>
                            <option value="cancelado">❌ Cancelado</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <div style={{ maxWidth: "200px" }}>
                            {productosPedido.length > 0 ? (
                              <div>
                                {productosPedido.slice(0, 2).map(pp => (
                                  <div key={pp.id_pedido_producto} style={{ fontSize: "12px" }}>
                                    • {pp.productos?.nombre} (x{pp.cantidad})
                                  </div>
                                ))}
                                {productosPedido.length > 2 && (
                                  <div style={{ fontSize: "11px", color: "#6d4611", opacity: 0.7, marginTop: "4px" }}>
                                    +{productosPedido.length - 2} más...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#6d4611", opacity: 0.7, fontStyle: "italic" }}>
                                Sin productos
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#28a745", fontWeight: "600", textAlign: "right" }}>
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(total)}
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", width: "180px" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => verDetallePedido(pedido)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 8px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#17a2b8",
                                color: "white"
                              }}
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => editarPedido(pedido)}
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
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => gestionarProductosPedido(pedido)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 8px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#28a745",
                                color: "white"
                              }}
                              title="Gestionar productos"
                            >
                              <RefreshCw size={14} />
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
                              title="Eliminar pedido"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredPedidos.length === 0 && (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
                  <ShoppingCart size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                  <p>No se encontraron pedidos</p>
                </div>
              )}
            </div>
          </div>
        </>
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