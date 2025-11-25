import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Package, 
  Search,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Loader,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Download,
  Filter,
  Calendar,
  Eye,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Zap,
  Clock,
  CalendarX,
  ShieldAlert,
  Ban,
  AlertOctagon
} from "lucide-react";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("lista");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [actionType, setActionType] = useState("entrada");

  const [form, setForm] = useState({
    id_producto: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    entradas: 0,
    salidas: 0,
    stock_minimo: 0,
    stock_maximo: 0
  });

  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    fecha_vencimiento: '',
    id_categoriaproducto: ''
  });

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroStock, setFiltroStock] = useState("todos");

  // Nuevos estados para validaciones
  const [formErrors, setFormErrors] = useState({});
  const [productFormErrors, setProductFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

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
      const [inventarioRes, productosRes, categoriasRes, pedidosRes, ventasRes] = await Promise.all([
        supabase.from('inventario').select(`
          *,
          productos (
            id_producto,
            nombre,
            descripcion,
            precio,
            fecha_vencimiento,
            categoria_productos (
              id_categoriaproducto,
              nombre,
              tipo
            )
          )
        `).order('fecha', { ascending: false }),
        supabase.from('productos').select(`
          *,
          categoria_productos (
            nombre,
            tipo
          )
        `),
        supabase.from('categoria_productos').select('*'),
        supabase.from('pedidos').select(`
          *,
          pedido_producto (
            id_producto,
            cantidad
          )
        `),
        supabase.from('ventas').select(`
          *,
          pedidos (
            pedido_producto (
              id_producto,
              cantidad
            )
          )
        `)
      ]);

      if (inventarioRes.error) throw inventarioRes.error;
      if (productosRes.error) throw productosRes.error;
      if (categoriasRes.error) throw categoriasRes.error;
      if (pedidosRes.error) console.warn('Error cargando pedidos:', pedidosRes.error);
      if (ventasRes.error) console.warn('Error cargando ventas:', ventasRes.error);

      setInventario(inventarioRes.data || []);
      setProductos(productosRes.data || []);
      setCategorias(categoriasRes.data || []);
      setPedidos(pedidosRes.data || []);
      setVentas(ventasRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validación de fecha de vencimiento
  const validarFechaVencimiento = (fecha) => {
    if (!fecha) return true; // Fecha opcional
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVencimiento = new Date(fecha);
    return fechaVencimiento >= hoy;
  };

  // Verificar si un producto está vencido
  const productoEstaVencido = (producto) => {
    if (!producto.fecha_vencimiento) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVencimiento = new Date(producto.fecha_vencimiento);
    return fechaVencimiento < hoy;
  };

  // Validación mejorada de producto
  const validateProducto = (producto) => {
    const errors = {};

    if (!producto.nombre.trim()) {
      errors.nombre = "El nombre del producto es requerido";
    } else if (producto.nombre.trim().length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (producto.nombre.trim().length > 100) {
      errors.nombre = "El nombre no puede exceder 100 caracteres";
    }

    if (!producto.precio || parseFloat(producto.precio) <= 0) {
      errors.precio = "El precio debe ser mayor a 0";
    } else if (parseFloat(producto.precio) > 1000000) {
      errors.precio = "El precio no puede ser mayor a 1,000,000 BOB";
    }

    if (!producto.id_categoriaproducto) {
      errors.id_categoriaproducto = "Debe seleccionar una categoría";
    }

    if (producto.fecha_vencimiento && !validarFechaVencimiento(producto.fecha_vencimiento)) {
      errors.fecha_vencimiento = "La fecha de vencimiento no puede ser anterior a hoy";
    }

    if (producto.descripcion && producto.descripcion.length > 500) {
      errors.descripcion = "La descripción no puede exceder 500 caracteres";
    }

    return errors;
  };

  // Validación mejorada de inventario
  const validateInventario = (item) => {
    const errors = {};

    if (!item.id_producto) {
      errors.id_producto = "Debe seleccionar un producto";
    }

    if (!item.fecha) {
      errors.fecha = "La fecha es requerida";
    } else {
      const fechaMovimiento = new Date(item.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaMovimiento > hoy) {
        errors.fecha = "La fecha no puede ser futura";
      }
    }

    const entradas = parseInt(item.entradas) || 0;
    const salidas = parseInt(item.salidas) || 0;
    
    if (entradas < 0) {
      errors.entradas = "Las entradas no pueden ser negativas";
    }
    
    if (salidas < 0) {
      errors.salidas = "Las salidas no pueden ser negativas";
    }
    
    if (entradas === 0 && salidas === 0) {
      errors.entradas = "Debe registrar al menos una entrada o salida";
      errors.salidas = "Debe registrar al menos una entrada o salida";
    }

    // Validar que no se vendan más productos de los que hay en stock
    if (salidas > 0 && item.id_producto) {
      const stockDisponible = calcularStockDisponible(parseInt(item.id_producto));
      if (salidas > stockDisponible) {
        errors.salidas = `No hay suficiente stock. Disponible: ${stockDisponible}`;
      }

      // Validar que no se vendan productos vencidos
      const producto = productos.find(p => p.id_producto === parseInt(item.id_producto));
      if (producto && productoEstaVencido(producto)) {
        errors.salidas = "No se pueden vender productos vencidos";
      }
    }

    // Validar stock mínimo y máximo
    const stockMinimo = parseInt(item.stock_minimo) || 0;
    const stockMaximo = parseInt(item.stock_maximo) || 0;
    
    if (stockMinimo < 0) {
      errors.stock_minimo = "El stock mínimo no puede ser negativo";
    }
    
    if (stockMaximo < 0) {
      errors.stock_maximo = "El stock máximo no puede ser negativo";
    }
    
    if (stockMaximo > 0 && stockMinimo > stockMaximo) {
      errors.stock_minimo = "El stock mínimo no puede ser mayor al stock máximo";
      errors.stock_maximo = "El stock máximo no puede ser menor al stock mínimo";
    }

    // Validar límites razonables
    if (entradas > 10000) {
      errors.entradas = "Las entradas no pueden ser mayores a 10,000 unidades";
    }

    if (salidas > 10000) {
      errors.salidas = "Las salidas no pueden ser mayores a 10,000 unidades";
    }

    return errors;
  };

  // Cálculo FIFO - Stock disponible actual
  const calcularStockDisponible = (idProducto) => {
    const movimientos = inventario.filter(item => item.id_producto === idProducto);
    const totalEntradas = movimientos.reduce((sum, item) => sum + (item.entradas || 0), 0);
    const totalSalidas = movimientos.reduce((sum, item) => sum + (item.salidas || 0), 0);
    return totalEntradas - totalSalidas;
  };

  // Obtener stock mínimo y máximo del último registro
  const obtenerConfiguracionStock = (idProducto) => {
    const movimientos = inventario
      .filter(item => item.id_producto === idProducto)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (movimientos.length > 0) {
      return {
        stock_minimo: movimientos[0].stock_minimo || 0,
        stock_maximo: movimientos[0].stock_maximo || 0
      };
    }
    return { stock_minimo: 0, stock_maximo: 0 };
  };

  // Calcular ventas del día para un producto
  const calcularVentasHoy = (idProducto) => {
    const hoy = new Date().toISOString().split('T')[0];
    
    return ventas.reduce((total, venta) => {
      const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0];
      if (fechaVenta === hoy && venta.pedidos && venta.pedidos.pedido_producto) {
        const productoEnVenta = venta.pedidos.pedido_producto.find(pp => pp.id_producto === idProducto);
        if (productoEnVenta) {
          return total + productoEnVenta.cantidad;
        }
      }
      return total;
    }, 0);
  };

  // Calcular total de ventas del producto
  const calcularTotalVentas = (idProducto) => {
    return ventas.reduce((total, venta) => {
      if (venta.pedidos && venta.pedidos.pedido_producto) {
        const productoEnVenta = venta.pedidos.pedido_producto.find(pp => pp.id_producto === idProducto);
        if (productoEnVenta) {
          return total + productoEnVenta.cantidad;
        }
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormErrors({});

      const errors = validateInventario(form);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        throw new Error("Por favor corrige los errores en el formulario");
      }
      
      const entradas = parseInt(form.entradas) || 0;
      const salidas = parseInt(form.salidas) || 0;
      const stockActual = calcularStockDisponible(parseInt(form.id_producto)) + entradas - salidas;

      const inventarioData = {
        id_producto: parseInt(form.id_producto),
        fecha: form.fecha || new Date().toISOString().split('T')[0],
        observaciones: form.observaciones || null,
        entradas: entradas,
        salidas: salidas,
        cantidad_actual: stockActual,
        stock_minimo: parseInt(form.stock_minimo) || 0,
        stock_maximo: parseInt(form.stock_maximo) || 0
      };

      if (editingId) {
        const { error } = await supabase
          .from('inventario')
          .update(inventarioData)
          .eq('id_inventario', editingId);
        if (error) throw error;
        showMessage("Registro de inventario actualizado exitosamente", "success");
      } else {
        const { error } = await supabase
          .from('inventario')
          .insert([inventarioData]);
        if (error) throw error;
        showMessage("Registro de inventario creado exitosamente", "success");
      }

      resetForm();
      cargarDatos();
    } catch (error) {
      if (!error.message.includes("Por favor corrige")) {
        showMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setProductFormErrors({});

      const errors = validateProducto(productForm);
      if (Object.keys(errors).length > 0) {
        setProductFormErrors(errors);
        throw new Error("Por favor corrige los errores en el formulario");
      }

      const productoData = {
        nombre: productForm.nombre.trim(),
        descripcion: productForm.descripcion.trim() || null,
        precio: parseFloat(productForm.precio),
        fecha_vencimiento: productForm.fecha_vencimiento || null,
        id_categoriaproducto: parseInt(productForm.id_categoriaproducto)
      };

      const { data, error } = await supabase
        .from('productos')
        .insert([productoData])
        .select();

      if (error) throw error;

      // Crear registro inicial en inventario automáticamente
      if (data && data[0]) {
        const inventarioInicial = {
          id_producto: data[0].id_producto,
          fecha: new Date().toISOString().split('T')[0],
          observaciones: 'Registro inicial de producto',
          entradas: 0,
          salidas: 0,
          cantidad_actual: 0,
          stock_minimo: 10,
          stock_maximo: 100
        };

        await supabase
          .from('inventario')
          .insert([inventarioInicial]);
      }

      showMessage("Producto creado y agregado al inventario exitosamente", "success");
      resetProductForm();
      cargarDatos();
    } catch (error) {
      if (!error.message.includes("Por favor corrige")) {
        showMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para agregar producto al inventario (primer registro)
  const agregarAlInventario = (producto) => {
    setForm({
      id_producto: producto.id_producto.toString(),
      fecha: new Date().toISOString().split('T')[0],
      observaciones: 'Primer registro en inventario',
      entradas: 0,
      salidas: 0,
      stock_minimo: 10,
      stock_maximo: 100
    });
    setEditingId(null);
    setShowForm(true);
    setActionType("entrada");
  };

  // Función para gestión rápida de stock con validaciones
  const gestionRapidaStock = async (producto, tipo, cantidad = 1) => {
    try {
      // Validar que el producto no esté vencido para salidas
      if (tipo === "salida" && productoEstaVencido(producto)) {
        throw new Error("No se puede vender un producto vencido");
      }

      const stockActual = calcularStockDisponible(producto.id_producto);
      const configuracion = obtenerConfiguracionStock(producto.id_producto);
      
      if (tipo === "salida" && cantidad > stockActual) {
        throw new Error(`No hay suficiente stock. Disponible: ${stockActual}`);
      }

      if (cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      if (cantidad > 1000) {
        throw new Error("La cantidad no puede ser mayor a 1,000 unidades en movimiento rápido");
      }

      const inventarioData = {
        id_producto: producto.id_producto,
        fecha: new Date().toISOString().split('T')[0],
        observaciones: `${tipo === "entrada" ? "Entrada" : "Salida"} rápida de stock`,
        entradas: tipo === "entrada" ? cantidad : 0,
        salidas: tipo === "salida" ? cantidad : 0,
        cantidad_actual: tipo === "entrada" ? stockActual + cantidad : stockActual - cantidad,
        stock_minimo: configuracion.stock_minimo,
        stock_maximo: configuracion.stock_maximo
      };

      const { error } = await supabase
        .from('inventario')
        .insert([inventarioData]);

      if (error) throw error;

      showMessage(`${tipo === "entrada" ? "Entrada" : "Salida"} de stock registrada exitosamente`, "success");
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const editarRegistro = (item) => {
    setForm({
      id_producto: item.id_producto.toString(),
      fecha: item.fecha,
      observaciones: item.observaciones || '',
      entradas: item.entradas,
      salidas: item.salidas,
      stock_minimo: item.stock_minimo,
      stock_maximo: item.stock_maximo
    });
    setEditingId(item.id_inventario);
    setShowForm(true);
    setFormErrors({});
  };

  const verDetalleProducto = (producto) => {
    setProductoSeleccionado(producto);
    setViewMode("detalle");
  };

  const eliminarRegistro = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de inventario?\nEsta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase
          .from('inventario')
          .delete()
          .eq('id_inventario', id);
        if (error) throw error;
        showMessage("Registro eliminado exitosamente", "success");
        cargarDatos();
      } catch (error) {
        showMessage(`Error eliminando registro: ${error.message}`);
      }
    }
  };

  const resetForm = () => {
    setForm({
      id_producto: '',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: '',
      entradas: 0,
      salidas: 0,
      stock_minimo: 0,
      stock_maximo: 0
    });
    setEditingId(null);
    setShowForm(false);
    setActionType("entrada");
    setFormErrors({});
  };

  const resetProductForm = () => {
    setProductForm({
      nombre: '',
      descripcion: '',
      precio: '',
      fecha_vencimiento: '',
      id_categoriaproducto: ''
    });
    setShowProductForm(false);
    setProductFormErrors({});
  };

  // Función para exportar a Excel
  const exportarAExcel = () => {
    if (productos.length === 0) {
      showMessage("No hay datos para exportar", "error");
      return;
    }

    const datosExportar = productos.map(producto => {
      const stockActual = calcularStockDisponible(producto.id_producto);
      const configuracion = obtenerConfiguracionStock(producto.id_producto);
      const ventasHoy = calcularVentasHoy(producto.id_producto);
      const totalVentas = calcularTotalVentas(producto.id_producto);
      const vencido = productoEstaVencido(producto);
      
      return {
        'Producto': producto.nombre || 'N/A',
        'Categoría': producto.categoria_productos?.nombre || 'N/A',
        'Stock Actual': stockActual,
        'Stock Mínimo': configuracion.stock_minimo,
        'Stock Máximo': configuracion.stock_maximo,
        'Ventas Hoy': ventasHoy,
        'Total Ventas': totalVentas,
        'Precio': producto.precio,
        'Estado': vencido ? 'VENCIDO' : 
                  stockActual <= configuracion.stock_minimo ? 'STOCK BAJO' : 
                  (configuracion.stock_maximo > 0 && stockActual > configuracion.stock_maximo) ? 'STOCK ALTO' : 'NORMAL',
        'En Inventario': inventario.some(item => item.id_producto === producto.id_producto) ? 'SÍ' : 'NO',
        'Vencimiento': producto.fecha_vencimiento || 'N/A'
      };
    });

    // Crear CSV
    const headers = Object.keys(datosExportar[0] || {}).join(',');
    const csvData = datosExportar.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${csvData}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_completo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showMessage("Datos exportados exitosamente", "success");
  };

  // Filtros para productos
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategoria = filtroCategoria === "todos" || 
      producto.categoria_productos?.id_categoriaproducto.toString() === filtroCategoria;

    const stockActual = calcularStockDisponible(producto.id_producto);
    const configuracion = obtenerConfiguracionStock(producto.id_producto);
    const vencido = productoEstaVencido(producto);
    
    const matchesStock = filtroStock === "todos" || 
      (filtroStock === "bajo" && stockActual <= configuracion.stock_minimo) ||
      (filtroStock === "normal" && stockActual > configuracion.stock_minimo && 
       (configuracion.stock_maximo === 0 || stockActual <= configuracion.stock_maximo)) ||
      (filtroStock === "alto" && configuracion.stock_maximo > 0 && stockActual > configuracion.stock_maximo) ||
      (filtroStock === "sin-inventario" && !inventario.some(i => i.id_producto === producto.id_producto)) ||
      (filtroStock === "vencido" && vencido);

    return matchesSearch && matchesCategoria && matchesStock;
  });

  // Estadísticas mejoradas
  const estadisticas = {
    totalProductos: productos.length,
    productosEnInventario: productos.filter(p => inventario.some(i => i.id_producto === p.id_producto)).length,
    productosConStockBajo: productos.filter(producto => {
      const stock = calcularStockDisponible(producto.id_producto);
      const configuracion = obtenerConfiguracionStock(producto.id_producto);
      return stock <= configuracion.stock_minimo;
    }).length,
    productosSinInventario: productos.filter(p => !inventario.some(i => i.id_producto === p.id_producto)).length,
    productosVencidos: productos.filter(producto => productoEstaVencido(producto)).length,
    valorTotalInventario: productos.reduce((total, producto) => {
      const stock = calcularStockDisponible(producto.id_producto);
      return total + (stock * (producto.precio || 0));
    }, 0),
    ventasHoy: productos.reduce((total, producto) => {
      return total + calcularVentasHoy(producto.id_producto);
    }, 0)
  };

  // Obtener historial de un producto
  const getHistorialProducto = (idProducto) => {
    return inventario
      .filter(item => item.id_producto === idProducto)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  // Componente para mostrar errores de formulario
  const ErrorMessage = ({ error }) => (
    error ? (
      <div style={styles.errorMessage}>
        <AlertOctagon size={12} />
        <span>{error}</span>
      </div>
    ) : null
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.pageHeader}>
        <h1 style={styles.pageHeaderH1}>Gestión de Inventario</h1>
        <p style={styles.pageHeaderP}>Control y seguimiento completo del stock de productos</p>
      </header>

      {/* Alertas */}
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} style={styles.alertClose}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} style={styles.alertClose}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Vista de Detalle de Producto */}
      {viewMode === "detalle" && productoSeleccionado && (
        <div style={styles.detalleProducto}>
          <div style={styles.detalleHeader}>
            <button 
              onClick={() => setViewMode("lista")}
              style={{...styles.btn, ...styles.btnSecondary}}
            >
              ← Volver al inventario
            </button>
            <h2 style={styles.detalleTitle}>Detalle del Producto</h2>
          </div>
          
          <div style={styles.detalleContent}>
            <div style={styles.detalleCard}>
              <div style={styles.productoInfo}>
                <div style={styles.productoHeader}>
                  <h3 style={styles.productoNombre}>{productoSeleccionado.nombre}</h3>
                  {productoEstaVencido(productoSeleccionado) && (
                    <span style={styles.vencidoBadge}>
                      <CalendarX size={16} />
                      VENCIDO
                    </span>
                  )}
                </div>
                <p style={styles.descripcion}>{productoSeleccionado.descripcion}</p>
                
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Categoría</label>
                    <span style={styles.infoValue}>{productoSeleccionado.categoria_productos?.nombre || 'N/A'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Tipo</label>
                    <span style={styles.infoValue}>{productoSeleccionado.categoria_productos?.tipo || 'N/A'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Precio</label>
                    <span style={{...styles.infoValue, ...styles.precio}}>
                      {new Intl.NumberFormat('es-BO', { 
                        style: 'currency', 
                        currency: 'BOB' 
                      }).format(productoSeleccionado.precio || 0)}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Stock Disponible</label>
                    <span style={{
                      ...styles.infoValue,
                      ...(calcularStockDisponible(productoSeleccionado.id_producto) <= 0 ? styles.stockCero : {})
                    }}>
                      {calcularStockDisponible(productoSeleccionado.id_producto)} unidades
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Ventas Hoy</label>
                    <span style={styles.infoValue}>
                      {calcularVentasHoy(productoSeleccionado.id_producto)} unidades
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Total Ventas</label>
                    <span style={styles.infoValue}>
                      {calcularTotalVentas(productoSeleccionado.id_producto)} unidades
                    </span>
                  </div>
                  {productoSeleccionado.fecha_vencimiento && (
                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Fecha Vencimiento</label>
                      <span style={{
                        ...styles.infoValue,
                        ...(productoEstaVencido(productoSeleccionado) ? styles.vencidoText : {})
                      }}>
                        {new Date(productoSeleccionado.fecha_vencimiento).toLocaleDateString()}
                        {productoEstaVencido(productoSeleccionado) && (
                          <span style={styles.vencidoIndicator}> • Vencido</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.historialMovimientos}>
              <h4 style={styles.historialTitle}>Historial de Movimientos</h4>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Entradas</th>
                      <th style={styles.th}>Salidas</th>
                      <th style={styles.th}>Stock Después</th>
                      <th style={styles.th}>Observaciones</th>
                      <th style={styles.th}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getHistorialProducto(productoSeleccionado.id_producto).map((movimiento) => (
                      <tr key={movimiento.id_inventario}>
                        <td style={styles.td}>{movimiento.fecha}</td>
                        <td style={{...styles.td, ...styles.entrada}}>{movimiento.entradas}</td>
                        <td style={{...styles.td, ...styles.salida}}>{movimiento.salidas}</td>
                        <td style={styles.td}>{movimiento.cantidad_actual}</td>
                        <td style={styles.td}>{movimiento.observaciones || '-'}</td>
                        <td style={styles.td}>
                          <div style={styles.actionButtonsSmall}>
                            <button
                              onClick={() => editarRegistro(movimiento)}
                              style={{...styles.btnSmall, ...styles.btnEdit}}
                              title="Editar movimiento"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => eliminarRegistro(movimiento.id_inventario)}
                              style={{...styles.btnSmall, ...styles.btnDanger}}
                              title="Eliminar movimiento"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {getHistorialProducto(productoSeleccionado.id_producto).length === 0 && (
                      <tr>
                        <td colSpan="6" style={{...styles.td, textAlign: 'center'}}>
                          No hay movimientos registrados para este producto
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista Principal de Inventario */}
      {viewMode === "lista" && (
        <>
          {/* Barra de búsqueda y filtros */}
          <div style={styles.searchFilterBar}>
            <div style={styles.searchBox}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterGroup}>
              <select 
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="todos">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria.id_categoriaproducto} value={categoria.id_categoriaproducto}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              <select 
                value={filtroStock}
                onChange={(e) => setFiltroStock(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="todos">Todo el stock</option>
                <option value="bajo">Stock Bajo</option>
                <option value="normal">Stock Normal</option>
                <option value="alto">Stock Alto</option>
                <option value="vencido">Productos Vencidos</option>
                <option value="sin-inventario">Sin Inventario</option>
              </select>
            </div>
          </div>

          {/* Dashboard de Estadísticas */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, ...styles.statIconTotal}}>
                <Package size={24} />
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{estadisticas.totalProductos}</div>
                <div style={styles.statLabel}>Total Productos</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, ...styles.statIconSuccess}}>
                <CheckCircle2 size={24} />
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{estadisticas.productosEnInventario}</div>
                <div style={styles.statLabel}>En Inventario</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, ...styles.statIconAlert}}>
                <AlertCircle size={24} />
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{estadisticas.productosConStockBajo}</div>
                <div style={styles.statLabel}>Stock Bajo</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, ...styles.statIconWarning}}>
                <AlertTriangle size={24} />
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{estadisticas.productosSinInventario}</div>
                <div style={styles.statLabel}>Sin Inventario</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, ...styles.statIconDanger}}>
                <CalendarX size={24} />
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{estadisticas.productosVencidos}</div>
                <div style={styles.statLabel}>Productos Vencidos</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, ...styles.statIconValor}}>
                <TrendingUp size={24} />
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>
                  {new Intl.NumberFormat('es-BO', { 
                    style: 'currency', 
                    currency: 'BOB' 
                  }).format(estadisticas.valorTotalInventario)}
                </div>
                <div style={styles.statLabel}>Valor Total</div>
              </div>
            </div>
          </div>

          {/* Alertas importantes */}
          {estadisticas.productosVencidos > 0 && (
            <div style={{...styles.alert, ...styles.alertDanger}}>
              <ShieldAlert size={20} />
              <span>
                <strong>ALERTA CRÍTICA:</strong> {estadisticas.productosVencidos} producto(s) vencido(s). 
                No se pueden vender y deben ser retirados del inventario.
              </span>
            </div>
          )}

          {estadisticas.productosConStockBajo > 0 && (
            <div style={{...styles.alert, ...styles.alertWarning}}>
              <AlertTriangle size={20} />
              <span>
                <strong>Alerta:</strong> {estadisticas.productosConStockBajo} producto(s) tienen stock bajo. 
                Es necesario realizar un reabastecimiento.
              </span>
            </div>
          )}

          {estadisticas.productosSinInventario > 0 && (
            <div style={{...styles.alert, ...styles.alertInfo}}>
              <AlertCircle size={20} />
              <span>
                <strong>Información:</strong> {estadisticas.productosSinInventario} producto(s) no tienen registro en inventario. 
                Agregalos para comenzar a gestionar su stock.
              </span>
            </div>
          )}

          {/* Botones de acción */}
          <div style={styles.actionButtons}>
            <button onClick={() => { resetForm(); setShowForm(true); }} style={{...styles.btn, ...styles.btnPrimary}}>
              <Plus size={16} />
              Nuevo Movimiento
            </button>
            <button onClick={() => setShowProductForm(true)} style={{...styles.btn, ...styles.btnSuccess}}>
              <Package size={16} />
              Agregar Producto
            </button>
            <button onClick={exportarAExcel} style={{...styles.btn, ...styles.btnSecondary}}>
              <Download size={16} />
              Exportar a Excel
            </button>
            <button onClick={cargarDatos} style={{...styles.btn, ...styles.btnInfo}}>
              <RotateCcw size={16} />
              Actualizar
            </button>
          </div>

          {/* Formulario de Producto */}
          {showProductForm && (
            <div style={styles.modalOverlay}>
              <div style={styles.modal}>
                <h3 style={styles.modalTitle}>Agregar Nuevo Producto</h3>
                <form onSubmit={handleProductSubmit}>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Nombre del Producto *</label>
                      <input
                        type="text"
                        value={productForm.nombre}
                        onChange={(e) => {
                          setProductForm({...productForm, nombre: e.target.value});
                          if (productFormErrors.nombre) {
                            setProductFormErrors({...productFormErrors, nombre: ''});
                          }
                        }}
                        required
                        style={{
                          ...styles.formInput,
                          ...(productFormErrors.nombre && styles.inputError)
                        }}
                        placeholder="Ej: Hamburguesa Clásica"
                        maxLength={100}
                      />
                      <ErrorMessage error={productFormErrors.nombre} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Precio (BOB) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000000"
                        value={productForm.precio}
                        onChange={(e) => {
                          setProductForm({...productForm, precio: e.target.value});
                          if (productFormErrors.precio) {
                            setProductFormErrors({...productFormErrors, precio: ''});
                          }
                        }}
                        required
                        style={{
                          ...styles.formInput,
                          ...(productFormErrors.precio && styles.inputError)
                        }}
                        placeholder="0.00"
                      />
                      <ErrorMessage error={productFormErrors.precio} />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Categoría *</label>
                      <select
                        value={productForm.id_categoriaproducto}
                        onChange={(e) => {
                          setProductForm({...productForm, id_categoriaproducto: e.target.value});
                          if (productFormErrors.id_categoriaproducto) {
                            setProductFormErrors({...productFormErrors, id_categoriaproducto: ''});
                          }
                        }}
                        required
                        style={{
                          ...styles.formSelect,
                          ...(productFormErrors.id_categoriaproducto && styles.inputError)
                        }}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map(categoria => (
                          <option key={categoria.id_categoriaproducto} value={categoria.id_categoriaproducto}>
                            {categoria.nombre} ({categoria.tipo})
                          </option>
                        ))}
                      </select>
                      <ErrorMessage error={productFormErrors.id_categoriaproducto} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Fecha de Vencimiento
                        {productForm.fecha_vencimiento && !validarFechaVencimiento(productForm.fecha_vencimiento) && (
                          <span style={styles.warningText}> (No puede ser fecha pasada)</span>
                        )}
                      </label>
                      <input
                        type="date"
                        value={productForm.fecha_vencimiento}
                        onChange={(e) => {
                          setProductForm({...productForm, fecha_vencimiento: e.target.value});
                          if (productFormErrors.fecha_vencimiento) {
                            setProductFormErrors({...productFormErrors, fecha_vencimiento: ''});
                          }
                        }}
                        style={{
                          ...styles.formInput,
                          ...(productFormErrors.fecha_vencimiento && styles.inputError)
                        }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <ErrorMessage error={productFormErrors.fecha_vencimiento} />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Descripción 
                      <span style={styles.charCount}>
                        ({productForm.descripcion?.length || 0}/500)
                      </span>
                    </label>
                    <textarea
                      value={productForm.descripcion}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setProductForm({...productForm, descripcion: e.target.value});
                          if (productFormErrors.descripcion) {
                            setProductFormErrors({...productFormErrors, descripcion: ''});
                          }
                        }
                      }}
                      placeholder="Descripción del producto..."
                      rows="3"
                      style={{
                        ...styles.formTextarea,
                        ...(productFormErrors.descripcion && styles.inputError)
                      }}
                    />
                    <ErrorMessage error={productFormErrors.descripcion} />
                  </div>

                  <div style={styles.formActions}>
                    <button 
                      type="submit" 
                      style={{...styles.btn, ...styles.btnSuccess}}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Crear Producto
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={resetProductForm} 
                      style={{...styles.btn, ...styles.btnCancel}}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Formulario modal de inventario */}
          {showForm && (
            <div style={styles.modalOverlay}>
              <div style={styles.modal}>
                <h3 style={styles.modalTitle}>{editingId ? "Editar Movimiento" : "Nuevo Movimiento de Inventario"}</h3>
                <form onSubmit={handleSubmit}>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Producto *</label>
                      <select
                        value={form.id_producto}
                        onChange={(e) => {
                          setForm({...form, id_producto: e.target.value});
                          if (formErrors.id_producto) {
                            setFormErrors({...formErrors, id_producto: ''});
                          }
                        }}
                        required
                        style={{
                          ...styles.formSelect,
                          ...(formErrors.id_producto && styles.inputError)
                        }}
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map(producto => {
                          const vencido = productoEstaVencido(producto);
                          return (
                            <option 
                              key={producto.id_producto} 
                              value={producto.id_producto}
                              disabled={vencido && form.salidas > 0}
                              style={vencido ? {color: '#dc3545'} : {}}
                            >
                              {producto.nombre} - Stock: {calcularStockDisponible(producto.id_producto)}
                              {vencido && ' (VENCIDO)'}
                              {!inventario.some(i => i.id_producto === producto.id_producto) && ' (Sin inventario)'}
                            </option>
                          );
                        })}
                      </select>
                      <ErrorMessage error={formErrors.id_producto} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Fecha *</label>
                      <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => {
                          setForm({...form, fecha: e.target.value});
                          if (formErrors.fecha) {
                            setFormErrors({...formErrors, fecha: ''});
                          }
                        }}
                        required
                        style={{
                          ...styles.formInput,
                          ...(formErrors.fecha && styles.inputError)
                        }}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <ErrorMessage error={formErrors.fecha} />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Entradas</label>
                      <input
                        type="number"
                        value={form.entradas}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setForm({...form, entradas: value});
                          if (formErrors.entradas) {
                            setFormErrors({...formErrors, entradas: ''});
                          }
                        }}
                        min="0"
                        max="10000"
                        placeholder="0"
                        style={{
                          ...styles.formInput,
                          ...(formErrors.entradas && styles.inputError)
                        }}
                      />
                      <ErrorMessage error={formErrors.entradas} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Salidas</label>
                      <input
                        type="number"
                        value={form.salidas}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setForm({...form, salidas: value});
                          if (formErrors.salidas) {
                            setFormErrors({...formErrors, salidas: ''});
                          }
                        }}
                        min="0"
                        max="10000"
                        placeholder="0"
                        style={{
                          ...styles.formInput,
                          ...(formErrors.salidas && styles.inputError)
                        }}
                      />
                      <ErrorMessage error={formErrors.salidas} />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Stock Mínimo</label>
                      <input
                        type="number"
                        value={form.stock_minimo}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setForm({...form, stock_minimo: value});
                          if (formErrors.stock_minimo) {
                            setFormErrors({...formErrors, stock_minimo: ''});
                          }
                        }}
                        min="0"
                        placeholder="0"
                        style={{
                          ...styles.formInput,
                          ...(formErrors.stock_minimo && styles.inputError)
                        }}
                      />
                      <ErrorMessage error={formErrors.stock_minimo} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Stock Máximo</label>
                      <input
                        type="number"
                        value={form.stock_maximo}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setForm({...form, stock_maximo: value});
                          if (formErrors.stock_maximo) {
                            setFormErrors({...formErrors, stock_maximo: ''});
                          }
                        }}
                        min="0"
                        placeholder="0"
                        style={{
                          ...styles.formInput,
                          ...(formErrors.stock_maximo && styles.inputError)
                        }}
                      />
                      <ErrorMessage error={formErrors.stock_maximo} />
                    </div>
                  </div>

                  {form.id_producto && (
                    <div style={styles.stockInfo}>
                      <div style={styles.stockItem}>
                        <strong>Stock Actual:</strong> {calcularStockDisponible(parseInt(form.id_producto))} unidades
                      </div>
                      <div style={styles.stockItem}>
                        <strong>Stock después del movimiento:</strong> 
                        {calcularStockDisponible(parseInt(form.id_producto)) + parseInt(form.entradas || 0) - parseInt(form.salidas || 0)} unidades
                      </div>
                      {productos.find(p => p.id_producto === parseInt(form.id_producto)) && 
                       productoEstaVencido(productos.find(p => p.id_producto === parseInt(form.id_producto))) && (
                        <div style={{...styles.stockItem, color: '#dc3545', fontWeight: 'bold'}}>
                          <ShieldAlert size={14} />
                          ADVERTENCIA: Este producto está vencido - No se permiten salidas
                        </div>
                      )}
                    </div>
                  )}

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Observaciones</label>
                    <textarea
                      value={form.observaciones}
                      onChange={(e) => setForm({...form, observaciones: e.target.value})}
                      placeholder="Detalles del movimiento..."
                      rows="3"
                      style={styles.formTextarea}
                      maxLength={500}
                    />
                  </div>

                  <div style={styles.formActions}>
                    <button 
                      type="submit" 
                      style={{...styles.btn, ...styles.btnSuccess}}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                          {editingId ? "Actualizando..." : "Guardando..."}
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          {editingId ? "Actualizar" : "Guardar Movimiento"}
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={resetForm} 
                      style={{...styles.btn, ...styles.btnCancel}}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tabla de inventario */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <Package size={20} />
              <h2 style={styles.tableTitle}>Inventario ({filteredProductos.length})</h2>
            </div>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Categoría</th>
                    <th style={styles.th}>Stock Actual</th>
                    <th style={styles.th}>Stock Mínimo</th>
                    <th style={styles.th}>Stock Máximo</th>
                    <th style={styles.th}>Ventas Hoy</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductos.map(producto => {
                    const stockActual = calcularStockDisponible(producto.id_producto);
                    const configuracion = obtenerConfiguracionStock(producto.id_producto);
                    const enInventario = inventario.some(item => item.id_producto === producto.id_producto);
                    const ventasHoy = calcularVentasHoy(producto.id_producto);
                    const vencido = productoEstaVencido(producto);
                    
                    let estado = "normal";
                    let estadoLabel = "Normal";
                    let estadoColor = "#28a745";
                    
                    if (vencido) {
                      estado = "vencido";
                      estadoLabel = "Vencido";
                      estadoColor = "#dc3545";
                    } else if (!enInventario) {
                      estado = "sin-inventario";
                      estadoLabel = "Sin Inventario";
                      estadoColor = "#6c757d";
                    } else if (stockActual <= configuracion.stock_minimo) {
                      estado = "bajo";
                      estadoLabel = "Bajo";
                      estadoColor = "#dc3545";
                    } else if (configuracion.stock_maximo > 0 && stockActual > configuracion.stock_maximo) {
                      estado = "alto";
                      estadoLabel = "Alto";
                      estadoColor = "#ffc107";
                    }

                    return (
                      <tr key={producto.id_producto}>
                        <td style={styles.td}>
                          <div style={styles.productNameContainer}>
                            <strong style={styles.productName}>{producto.nombre}</strong>
                            {vencido && <CalendarX size={14} style={{color: '#dc3545', marginLeft: '8px'}} />}
                          </div>
                          {producto.descripcion && (
                            <div style={styles.productDescription}>{producto.descripcion}</div>
                          )}
                          {producto.fecha_vencimiento && (
                            <div style={{
                              ...styles.vencimientoText,
                              color: vencido ? '#dc3545' : '#6c757d'
                            }}>
                              Vence: {new Date(producto.fecha_vencimiento).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>{producto.categoria_productos?.nombre || 'N/A'}</td>
                        <td style={styles.td}>
                          <strong style={{color: estadoColor, fontSize: '16px'}}>
                            {stockActual}
                          </strong>
                        </td>
                        <td style={styles.td}>{configuracion.stock_minimo}</td>
                        <td style={styles.td}>{configuracion.stock_maximo}</td>
                        <td style={styles.td}>
                          <span style={{color: ventasHoy > 0 ? '#28a745' : '#6c757d'}}>
                            {ventasHoy}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.estadoBadge,
                            backgroundColor: estado === 'vencido' ? '#fff5f5' : 
                                           estado === 'bajo' ? '#fff5f5' : 
                                           estado === 'alto' ? '#fff3cd' : 
                                           estado === 'sin-inventario' ? '#f8f9fa' : '#e8f5e8',
                            color: estadoColor,
                            border: estado === 'sin-inventario' ? '1px solid #dee2e6' : 'none'
                          }}>
                            {estadoLabel}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtonsSmall}>
                            <button
                              onClick={() => verDetalleProducto(producto)}
                              style={{...styles.btnSmall, ...styles.btnView}}
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </button>
                            {enInventario ? (
                              <>
                                <button
                                  onClick={() => gestionRapidaStock(producto, "entrada", 1)}
                                  style={{...styles.btnSmall, ...styles.btnSuccess}}
                                  title="Entrada rápida"
                                >
                                  <ArrowDownToLine size={14} />
                                </button>
                                <button
                                  onClick={() => gestionRapidaStock(producto, "salida", 1)}
                                  style={{...styles.btnSmall, ...styles.btnWarning}}
                                  title="Salida rápida"
                                  disabled={stockActual <= 0 || vencido}
                                >
                                  <ArrowUpFromLine size={14} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => agregarAlInventario(producto)}
                                style={{...styles.btnSmall, ...styles.btnInfo}}
                                title="Agregar al inventario"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProductos.length === 0 && (
                <div style={styles.emptyState}>
                  <Package size={48} style={{opacity: 0.5, marginBottom: '16px'}} />
                  <p>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Estilos globales */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #7a3b06 !important;
        }
        
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
}

// Estilos actualizados
const styles = {
  container: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto"
  },
  pageHeader: {
    marginBottom: "30px"
  },
  pageHeaderH1: {
    fontSize: "28px",
    color: "#7a3b06",
    marginBottom: "8px",
    fontWeight: "700"
  },
  pageHeaderP: {
    color: "#6d4611",
    fontSize: "14px",
    opacity: 0.9
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    color: "#7a3b06"
  },
  alert: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px"
  },
  alertError: {
    backgroundColor: "#fee",
    border: "1px solid #f5c6cb",
    color: "#721c24"
  },
  alertSuccess: {
    backgroundColor: "#f0fff4",
    border: "1px solid #c3e6cb",
    color: "#155724"
  },
  alertWarning: {
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    color: "#856404"
  },
  alertInfo: {
    backgroundColor: "#e3f2fd",
    border: "1px solid #bbdefb",
    color: "#1976d2"
  },
  alertDanger: {
    backgroundColor: "#f8d7da",
    border: "1px solid #f1aeb5",
    color: "#721c24",
    fontWeight: "bold"
  },
  alertClose: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    opacity: 0.7
  },
  // Vista de Detalle
  detalleProducto: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e9d8b5",
    overflow: "hidden"
  },
  detalleHeader: {
    padding: "20px",
    borderBottom: "1px solid #e9d8b5",
    background: "#f8f5ee",
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  detalleTitle: {
    color: "#7a3b06",
    margin: 0
  },
  detalleContent: {
    padding: "30px"
  },
  detalleCard: {
    marginBottom: "30px"
  },
  productoInfo: {
    marginBottom: "20px"
  },
  productoHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px"
  },
  productoNombre: {
    color: "#7a3b06",
    margin: 0,
    fontSize: "24px"
  },
  vencidoBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#dc3545",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold"
  },
  descripcion: {
    color: "#6d4611",
    marginBottom: "20px",
    lineHeight: 1.5
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px"
  },
  infoItem: {
    padding: "15px",
    background: "#f8f5ee",
    borderRadius: "8px"
  },
  infoLabel: {
    display: "block",
    fontSize: "12px",
    color: "#6d4611",
    opacity: 0.8,
    marginBottom: "4px"
  },
  infoValue: {
    display: "block",
    fontWeight: "500",
    color: "#7a3b06"
  },
  precio: {
    color: "#28a745",
    fontWeight: "700"
  },
  stockCero: {
    color: "#dc3545"
  },
  vencidoText: {
    color: "#dc3545",
    fontWeight: "600"
  },
  vencimientoText: {
    fontSize: "12px",
    marginTop: "4px"
  },
  vencidoIndicator: {
    color: "#dc3545",
    fontSize: "12px",
    fontWeight: "bold"
  },
  historialMovimientos: {
    marginTop: "30px"
  },
  historialTitle: {
    color: "#7a3b06",
    marginBottom: "15px"
  },
  // Barra de búsqueda y filtros
  searchFilterBar: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  searchBox: {
    position: "relative",
    flex: "1",
    minWidth: "300px"
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6d4611"
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    border: "1px solid #e9d8b5",
    borderRadius: "8px",
    fontSize: "14px"
  },
  filterGroup: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  filterSelect: {
    padding: "12px",
    border: "1px solid #e9d8b5",
    borderRadius: "8px",
    fontSize: "14px",
    minWidth: "180px"
  },
  // Estadísticas
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  },
  statCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e9d8b5",
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  statIcon: {
    background: "#f8f5ee",
    padding: "12px",
    borderRadius: "8px",
    color: "#7a3b06"
  },
  statIconTotal: {
    background: "#e3f2fd",
    color: "#1976d2"
  },
  statIconSuccess: {
    background: "#e8f5e8",
    color: "#28a745"
  },
  statIconAlert: {
    background: "#fff5f5",
    color: "#dc3545"
  },
  statIconWarning: {
    background: "#fff3cd",
    color: "#ffc107"
  },
  statIconDanger: {
    background: "#f8d7da",
    color: "#dc3545"
  },
  statIconValor: {
    background: "#f3e5f5",
    color: "#9c27b0"
  },
  statInfo: {
    flex: "1"
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#7a3b06",
    marginBottom: "4px"
  },
  statLabel: {
    fontSize: "12px",
    color: "#6d4611",
    opacity: 0.8
  },
  // Botones y formularios
  actionButtons: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s"
  },
  btnPrimary: {
    backgroundColor: "#7a3b06",
    color: "white"
  },
  btnSecondary: {
    backgroundColor: "#6d4611",
    color: "white"
  },
  btnSuccess: {
    backgroundColor: "#28a745",
    color: "white"
  },
  btnCancel: {
    backgroundColor: "#6c757d",
    color: "white"
  },
  btnInfo: {
    backgroundColor: "#17a2b8",
    color: "white"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modal: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e9d8b5",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto"
  },
  modalTitle: {
    color: "#7a3b06",
    marginBottom: "20px",
    fontSize: "20px"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px"
  },
  formGroup: {
    marginBottom: "16px"
  },
  formLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#6d4611",
    fontWeight: "500"
  },
  formInput: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e9d8b5",
    borderRadius: "6px",
    fontSize: "14px"
  },
  formSelect: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e9d8b5",
    borderRadius: "6px",
    fontSize: "14px",
    background: "white"
  },
  formTextarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e9d8b5",
    borderRadius: "6px",
    fontSize: "14px",
    resize: "vertical"
  },
  stockInfo: {
    background: "#e3f2fd",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "16px",
    border: "1px solid #bbdefb"
  },
  stockItem: {
    color: "#1976d2",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px"
  },
  // Tabla
  tableCard: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e9d8b5",
    overflow: "hidden"
  },
  tableHeader: {
    padding: "20px",
    borderBottom: "1px solid #e9d8b5",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f8f5ee"
  },
  tableTitle: {
    color: "#7a3b06",
    margin: 0,
    fontSize: "18px"
  },
  tableContainer: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px"
  },
  th: {
    padding: "12px",
    textAlign: "left",
    border: "1px solid #e9d8b5",
    color: "#6d4611",
    fontWeight: "600",
    background: "#f8f5ee"
  },
  td: {
    padding: "12px",
    border: "1px solid #e9d8b5",
    color: "#6d4611"
  },
  productNameContainer: {
    display: "flex",
    alignItems: "center"
  },
  productName: {
    display: "block",
    color: "#7a3b06",
    marginBottom: "4px"
  },
  productDescription: {
    fontSize: "12px",
    color: "#6d4611",
    opacity: 0.8
  },
  entrada: {
    color: "#28a745",
    fontWeight: "600"
  },
  salida: {
    color: "#dc3545",
    fontWeight: "600"
  },
  estadoBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600"
  },
  actionButtonsSmall: {
    display: "flex",
    gap: "6px"
  },
  btnSmall: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 8px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  btnView: {
    backgroundColor: "#17a2b8",
    color: "white"
  },
  btnEdit: {
    backgroundColor: "#ffc107",
    color: "#7a3b06"
  },
  btnSuccess: {
    backgroundColor: "#28a745",
    color: "white"
  },
  btnWarning: {
    backgroundColor: "#ffc107",
    color: "#7a3b06"
  },
  btnInfo: {
    backgroundColor: "#17a2b8",
    color: "white"
  },
  btnDanger: {
    backgroundColor: "#dc3545",
    color: "white"
  },
  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#6d4611",
    opacity: 0.7
  },
  // Nuevos estilos para validaciones
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: '500'
  },
  inputError: {
    borderColor: '#dc3545 !important',
    backgroundColor: '#fff5f5'
  },
  warningText: {
    color: '#dc3545',
    fontSize: '12px',
    fontWeight: 'normal'
  },
  charCount: {
    fontSize: '12px',
    color: '#6c757d',
    fontWeight: 'normal',
    marginLeft: '8px'
  }
};