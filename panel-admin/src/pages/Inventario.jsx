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
  ShoppingCart,
  Upload,
  Download,
  Filter,
  Calendar,
  Eye
} from "lucide-react";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("lista");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [form, setForm] = useState({
    id_producto: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    entradas: 0,
    salidas: 0,
    cantidad_actual: 0,
    stock_minimo: 0,
    stock_maximo: 0
  });

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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
      const [inventarioRes, productosRes, categoriasRes] = await Promise.all([
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
        supabase.from('categoria_productos').select('*')
      ]);

      if (inventarioRes.error) throw inventarioRes.error;
      if (productosRes.error) throw productosRes.error;
      if (categoriasRes.error) throw categoriasRes.error;

      setInventario(inventarioRes.data || []);
      setProductos(productosRes.data || []);
      setCategorias(categoriasRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validateInventario = (item) => {
    if (!item.id_producto) throw new Error("Debe seleccionar un producto");
    if (!item.fecha) throw new Error("La fecha es requerida");
    
    if (parseInt(item.entradas) < 0) throw new Error("Las entradas no pueden ser negativas");
    if (parseInt(item.salidas) < 0) throw new Error("Las salidas no pueden ser negativas");
    if (parseInt(item.cantidad_actual) < 0) throw new Error("El stock actual no puede ser negativo");
    if (parseInt(item.stock_minimo) < 0) throw new Error("El stock mínimo no puede ser negativo");
    if (parseInt(item.stock_maximo) < 0) throw new Error("El stock máximo no puede ser negativo");
    
    if (parseInt(item.stock_maximo) > 0 && parseInt(item.stock_minimo) >= parseInt(item.stock_maximo)) {
      throw new Error("El stock mínimo debe ser menor al stock máximo");
    }

    // Validar que las salidas no excedan el stock disponible
    const producto = productos.find(p => p.id_producto === parseInt(item.id_producto));
    if (producto) {
      const stockActual = calcularStockActual(producto.id_producto);
      if (parseInt(item.salidas) > stockActual + parseInt(item.entradas)) {
        throw new Error(`Las salidas (${item.salidas}) exceden el stock disponible (${stockActual + parseInt(item.entradas)})`);
      }
    }
  };

  // Calcular stock actual para un producto
  const calcularStockActual = (idProducto) => {
    const movimientos = inventario.filter(item => item.id_producto === idProducto);
    return movimientos.reduce((total, item) => total + item.entradas - item.salidas, 0);
  };

  // Calcular stock proyectado (después del movimiento)
  const calcularStockProyectado = (idProducto, nuevasEntradas, nuevasSalidas) => {
    const stockActual = calcularStockActual(idProducto);
    return stockActual + nuevasEntradas - nuevasSalidas;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateInventario(form);
      
      const inventarioData = {
        ...form,
        entradas: parseInt(form.entradas),
        salidas: parseInt(form.salidas),
        cantidad_actual: parseInt(form.cantidad_actual),
        stock_minimo: parseInt(form.stock_minimo),
        stock_maximo: parseInt(form.stock_maximo),
        fecha: form.fecha || new Date().toISOString().split('T')[0]
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
      showMessage(error.message);
    }
  };

  const editarRegistro = (item) => {
    setForm({
      id_producto: item.id_producto,
      fecha: item.fecha,
      observaciones: item.observaciones || '',
      entradas: item.entradas,
      salidas: item.salidas,
      cantidad_actual: item.cantidad_actual || 0,
      stock_minimo: item.stock_minimo,
      stock_maximo: item.stock_maximo
    });
    setEditingId(item.id_inventario);
    setShowForm(true);
  };

  const verDetalleProducto = (producto) => {
    setProductoSeleccionado(producto);
    setViewMode("detalle");
  };

  const eliminarRegistro = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de inventario?')) {
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
      cantidad_actual: 0,
      stock_minimo: 0,
      stock_maximo: 0
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Filtros y cálculos avanzados
  const filteredInventario = inventario.filter(item => {
    const producto = item.productos;
    if (!producto) return false;

    const matchesSearch = 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.observaciones.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria = filtroCategoria === "todos" || 
      producto.categoria_productos?.id_categoriaproducto.toString() === filtroCategoria;

    const matchesStock = filtroStock === "todos" || 
      (filtroStock === "bajo" && item.cantidad_actual <= item.stock_minimo) ||
      (filtroStock === "optimo" && item.cantidad_actual > item.stock_minimo && item.cantidad_actual <= item.stock_maximo) ||
      (filtroStock === "exceso" && item.cantidad_actual > item.stock_maximo);

    const matchesFecha = (!fechaDesde || item.fecha >= fechaDesde) && 
                        (!fechaHasta || item.fecha <= fechaHasta);

    return matchesSearch && matchesCategoria && matchesStock && matchesFecha;
  });

  // Estadísticas avanzadas
  const estadisticas = {
    totalProductos: [...new Set(inventario.map(item => item.id_producto))].length,
    totalMovimientos: filteredInventario.length,
    stockBajo: inventario.filter(item => item.cantidad_actual <= item.stock_minimo).length,
    stockOptimo: inventario.filter(item => item.cantidad_actual > item.stock_minimo && item.cantidad_actual <= item.stock_maximo).length,
    stockExceso: inventario.filter(item => item.cantidad_actual > item.stock_maximo).length,
    valorTotalInventario: inventario.reduce((total, item) => {
      const producto = item.productos;
      return total + (item.cantidad_actual * (producto?.precio || 0));
    }, 0),
    entradasTotales: filteredInventario.reduce((total, item) => total + item.entradas, 0),
    salidasTotales: filteredInventario.reduce((total, item) => total + item.salidas, 0)
  };

  // Productos próximos a vencer (si hay fecha de vencimiento)
  const productosProximosVencer = productos.filter(producto => {
    if (!producto.fecha_vencimiento) return false;
    const fechaVencimiento = new Date(producto.fecha_vencimiento);
    const hoy = new Date();
    const diferenciaDias = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diferenciaDias <= 30 && diferenciaDias > 0;
  });

  // Obtener historial de un producto
  const getHistorialProducto = (idProducto) => {
    return inventario
      .filter(item => item.id_producto === idProducto)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={32} className="spinner" />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="page-header">
        <h1>Gestión de Inventario</h1>
        <p>Control y seguimiento completo del stock de productos</p>
      </header>

      {/* Alertas */}
      {error && (
        <div className="alert error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert success">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Vista de Detalle de Producto */}
      {viewMode === "detalle" && productoSeleccionado && (
        <div className="detalle-producto">
          <div className="detalle-header">
            <button 
              onClick={() => setViewMode("lista")}
              className="btn btn-secondary"
            >
              ← Volver al inventario
            </button>
            <h2>Detalle del Producto</h2>
          </div>
          
          <div className="detalle-content">
            <div className="detalle-card">
              <div className="producto-info">
                <h3>{productoSeleccionado.nombre}</h3>
                <p className="descripcion">{productoSeleccionado.descripcion}</p>
                
                <div className="info-grid">
                  <div className="info-item">
                    <label>Categoría</label>
                    <span>{productoSeleccionado.categoria_productos?.nombre || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Tipo</label>
                    <span>{productoSeleccionado.categoria_productos?.tipo || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Precio</label>
                    <span className="precio">
                      {new Intl.NumberFormat('es-BO', { 
                        style: 'currency', 
                        currency: 'BOB' 
                      }).format(productoSeleccionado.precio)}
                    </span>
                  </div>
                  {productoSeleccionado.fecha_vencimiento && (
                    <div className="info-item">
                      <label>Vencimiento</label>
                      <span className={new Date(productoSeleccionado.fecha_vencimiento) < new Date() ? 'vencido' : 'vigente'}>
                        {new Date(productoSeleccionado.fecha_vencimiento).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="stock-info">
                <h4>Estado de Stock</h4>
                <div className="stock-stats">
                  <div className="stat">
                    <span className="value">{calcularStockActual(productoSeleccionado.id_producto)}</span>
                    <span className="label">Stock Actual</span>
                  </div>
                  <div className="stat">
                    <span className="value">0</span>
                    <span className="label">Stock Mínimo</span>
                  </div>
                  <div className="stat">
                    <span className="value">0</span>
                    <span className="label">Stock Máximo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="historial-movimientos">
              <h4>Historial de Movimientos</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Entradas</th>
                      <th>Salidas</th>
                      <th>Stock</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getHistorialProducto(productoSeleccionado.id_producto).map((movimiento, index) => (
                      <tr key={movimiento.id_inventario}>
                        <td>{movimiento.fecha}</td>
                        <td className="entrada">{movimiento.entradas}</td>
                        <td className="salida">{movimiento.salidas}</td>
                        <td className="stock">
                          {calcularStockActual(movimiento.id_producto) - 
                           getHistorialProducto(productoSeleccionado.id_producto)
                            .slice(0, index)
                            .reduce((total, item) => total + item.entradas - item.salidas, 0)}
                        </td>
                        <td>{movimiento.observaciones || '-'}</td>
                      </tr>
                    ))}
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
          {/* Barra de búsqueda y filtros avanzados */}
          <div className="search-filter-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por producto, descripción u observaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select 
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria.id_categoriaproducto} value={categoria.id_categoriaproducto}>
                    {categoria.nombre} ({categoria.tipo})
                  </option>
                ))}
              </select>
              <select 
                value={filtroStock}
                onChange={(e) => setFiltroStock(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todo el stock</option>
                <option value="bajo">Stock Bajo</option>
                <option value="optimo">Stock Óptimo</option>
                <option value="exceso">Stock en Exceso</option>
              </select>
              <div className="date-filters">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  placeholder="Desde"
                  className="date-input"
                />
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  placeholder="Hasta"
                  className="date-input"
                />
              </div>
            </div>
          </div>

          {/* Dashboard de Estadísticas */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <Package size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{estadisticas.totalProductos}</div>
                <div className="stat-label">Productos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon movimientos">
                <BarChart3 size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{estadisticas.totalMovimientos}</div>
                <div className="stat-label">Movimientos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon valor">
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {new Intl.NumberFormat('es-BO', { 
                    style: 'currency', 
                    currency: 'BOB' 
                  }).format(estadisticas.valorTotalInventario)}
                </div>
                <div className="stat-label">Valor Total</div>
              </div>
            </div>
            <div className="stat-card alert">
              <div className="stat-icon">
                <AlertCircle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{estadisticas.stockBajo}</div>
                <div className="stat-label">Stock Bajo</div>
              </div>
            </div>
          </div>

          {/* Alertas importantes */}
          {estadisticas.stockBajo > 0 && (
            <div className="alert warning">
              <AlertTriangle size={20} />
              <span>
                <strong>Alerta:</strong> {estadisticas.stockBajo} producto(s) tienen stock bajo. 
                Es necesario realizar un reabastecimiento.
              </span>
            </div>
          )}

          {productosProximosVencer.length > 0 && (
            <div className="alert warning">
              <Calendar size={20} />
              <span>
                <strong>Atención:</strong> {productosProximosVencer.length} producto(s) están próximos a vencer.
              </span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="action-buttons">
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
              <Plus size={16} />
              Nuevo Movimiento
            </button>
            <button className="btn btn-secondary">
              <Upload size={16} />
              Entrada Rápida
            </button>
            <button className="btn btn-secondary">
              <Download size={16} />
              Salida Rápida
            </button>
          </div>

          {/* Formulario modal */}
          {showForm && (
            <div className="modal-overlay">
              <div className="modal large">
                <h3>{editingId ? "Editar Movimiento" : "Nuevo Movimiento de Inventario"}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Producto *</label>
                      <select
                        value={form.id_producto}
                        onChange={(e) => {
                          const nuevoProducto = e.target.value;
                          setForm({...form, id_producto: nuevoProducto});
                          // Actualizar stock actual al cambiar producto
                          if (nuevoProducto) {
                            const stock = calcularStockActual(parseInt(nuevoProducto));
                            setForm(prev => ({...prev, cantidad_actual: stock}));
                          }
                        }}
                        required
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map(producto => (
                          <option key={producto.id_producto} value={producto.id_producto}>
                            {producto.nombre} - {producto.categoria_productos?.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fecha *</label>
                      <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => setForm({...form, fecha: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Entradas</label>
                      <input
                        type="number"
                        value={form.entradas}
                        onChange={(e) => setForm({...form, entradas: e.target.value})}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Salidas</label>
                      <input
                        type="number"
                        value={form.salidas}
                        onChange={(e) => setForm({...form, salidas: e.target.value})}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock Actual</label>
                      <input
                        type="number"
                        value={form.cantidad_actual}
                        onChange={(e) => setForm({...form, cantidad_actual: e.target.value})}
                        min="0"
                        placeholder="0"
                        disabled
                      />
                    </div>
                  </div>

                  {form.id_producto && (
                    <div className="stock-proyeccion">
                      <div className="proyeccion-info">
                        <strong>Stock Proyectado:</strong> 
                        {calcularStockProyectado(
                          parseInt(form.id_producto), 
                          parseInt(form.entradas) || 0, 
                          parseInt(form.salidas) || 0
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Stock Mínimo</label>
                      <input
                        type="number"
                        value={form.stock_minimo}
                        onChange={(e) => setForm({...form, stock_minimo: e.target.value})}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock Máximo</label>
                      <input
                        type="number"
                        value={form.stock_maximo}
                        onChange={(e) => setForm({...form, stock_maximo: e.target.value})}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Observaciones</label>
                    <textarea
                      value={form.observaciones}
                      onChange={(e) => setForm({...form, observaciones: e.target.value})}
                      placeholder="Detalles del movimiento..."
                      rows="3"
                      maxLength={200}
                    />
                    <span className="char-count">{form.observaciones.length}/200</span>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">
                      <Save size={16} />
                      {editingId ? "Actualizar" : "Guardar Movimiento"}
                    </button>
                    <button type="button" onClick={resetForm} className="btn btn-cancel">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tabla de inventario */}
          <div className="table-card">
            <div className="table-header">
              <Package size={20} />
              <h2>Inventario ({filteredInventario.length})</h2>
              <div className="table-actions">
                <span className={`badge ${estadisticas.stockBajo > 0 ? 'badge-danger' : 'badge-success'}`}>
                  {estadisticas.stockBajo} alertas
                </span>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Fecha</th>
                    <th>Entradas</th>
                    <th>Salidas</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventario.map(item => {
                    const producto = item.productos;
                    const stockActual = item.cantidad_actual;
                    const stockMinimo = item.stock_minimo;
                    const stockMaximo = item.stock_maximo;
                    
                    let estado = "optimo";
                    let estadoLabel = "Óptimo";
                    let estadoIcon = <CheckCircle2 size={14} />;
                    
                    if (stockActual <= stockMinimo) {
                      estado = "bajo";
                      estadoLabel = "Bajo";
                      estadoIcon = <AlertCircle size={14} />;
                    } else if (stockActual > stockMaximo) {
                      estado = "exceso";
                      estadoLabel = "Exceso";
                      estadoIcon = <TrendingUp size={14} />;
                    }

                    return (
                      <tr key={item.id_inventario} className={estado}>
                        <td className="producto-cell">
                          <strong>{producto?.nombre || 'N/A'}</strong>
                          {producto?.descripcion && (
                            <small>{producto.descripcion}</small>
                          )}
                        </td>
                        <td className="categoria-cell">
                          {producto?.categoria_productos?.nombre || 'N/A'}
                        </td>
                        <td className="fecha-cell">{item.fecha}</td>
                        <td className="entrada-cell">
                          <span className="badge entrada">{item.entradas}</span>
                        </td>
                        <td className="salida-cell">
                          <span className="badge salida">{item.salidas}</span>
                        </td>
                        <td className="stock-cell">
                          <strong>{stockActual}</strong>
                        </td>
                        <td className="estado-cell">
                          <span className={`estado ${estado}`}>
                            {estadoIcon}
                            {estadoLabel}
                          </span>
                        </td>
                        <td className="observaciones-cell">
                          {item.observaciones || '-'}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons-small">
                            <button
                              onClick={() => producto && verDetalleProducto(producto)}
                              className="btn-view"
                              title="Ver detalles"
                              disabled={!producto}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => editarRegistro(item)}
                              className="btn-edit"
                              title="Editar movimiento"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => eliminarRegistro(item.id_inventario)}
                              className="btn-delete"
                              title="Eliminar movimiento"
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
              {filteredInventario.length === 0 && (
                <div className="empty-state">
                  <Package size={48} />
                  <p>No se encontraron registros de inventario</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          font-size: 28px;
          color: #7a3b06;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .page-header p {
          color: #6d4611;
          font-size: 14px;
          opacity: 0.9;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #7a3b06;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert.error {
          background-color: #fee;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .alert.success {
          background-color: #f0fff4;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .alert.warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
        }

        /* Vista de Detalle */
        .detalle-producto {
          background: white;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          overflow: hidden;
        }

        .detalle-header {
          padding: 20px;
          border-bottom: 1px solid #e9d8b5;
          background-color: #f8f5ee;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .detalle-header h2 {
          color: #7a3b06;
          margin: 0;
        }

        .detalle-content {
          padding: 30px;
        }

        .detalle-card {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .producto-info h3 {
          color: #7a3b06;
          margin-bottom: 10px;
          font-size: 24px;
        }

        .descripcion {
          color: #6d4611;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .info-item {
          padding: 15px;
          background: #f8f5ee;
          border-radius: 8px;
        }

        .info-item label {
          display: block;
          font-size: 12px;
          color: #6d4611;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .info-item span {
          display: block;
          font-weight: 500;
          color: #7a3b06;
        }

        .precio {
          color: #28a745 !important;
          font-weight: 700 !important;
        }

        .vencido {
          color: #dc3545 !important;
        }

        .vigente {
          color: #28a745 !important;
        }

        .stock-info {
          background: #e8f5e8;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #c3e6cb;
        }

        .stock-info h4 {
          color: #155724;
          margin-bottom: 15px;
        }

        .stock-stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .stat {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 6px;
        }

        .stat .value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #155724;
        }

        .stat .label {
          font-size: 12px;
          color: #6d4611;
          opacity: 0.8;
        }

        .historial-movimientos h4 {
          color: #7a3b06;
          margin-bottom: 15px;
        }

        /* Barra de búsqueda y filtros */
        .search-filter-bar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .search-box {
          position: relative;
          flex: 1;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6d4611;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
        }

        .filter-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 12px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
          min-width: 180px;
        }

        .date-filters {
          display: flex;
          gap: 8px;
        }

        .date-input {
          padding: 12px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
          min-width: 150px;
        }

        /* Estadísticas */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card.alert {
          border-color: #dc3545;
          background: #fee;
        }

        .stat-icon {
          background: #f8f5ee;
          padding: 12px;
          border-radius: 8px;
          color: #7a3b06;
        }

        .stat-icon.total { background: #e3f2fd; color: #1976d2; }
        .stat-icon.movimientos { background: #fff3e0; color: #f57c00; }
        .stat-icon.valor { background: #e8f5e8; color: #28a745; }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #7a3b06;
        }

        .stat-label {
          font-size: 12px;
          color: #6d4611;
          opacity: 0.8;
        }

        /* Botones y formularios */
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #7a3b06;
          color: white;
        }

        .btn-secondary {
          background-color: #6d4611;
          color: white;
        }

        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .btn-cancel {
          background-color: #6c757d;
          color: white;
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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal.large {
          max-width: 800px;
        }

        .modal h3 {
          color: #7a3b06;
          margin-bottom: 20px;
          font-size: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #6d4611;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #7a3b06;
        }

        .form-group input:disabled {
          background-color: #f8f9fa;
          opacity: 0.7;
        }

        .stock-proyeccion {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 16px;
          border: 1px solid #bbdefb;
        }

        .proyeccion-info {
          color: #1976d2;
          font-weight: 500;
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #6d4611;
          opacity: 0.7;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        /* Tabla */
        .table-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          overflow: hidden;
        }

        .table-header {
          padding: 20px;
          border-bottom: 1px solid #e9d8b5;
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #f8f5ee;
        }

        .table-header h2 {
          color: #7a3b06;
          margin: 0;
          font-size: 18px;
          flex: 1;
        }

        .table-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }

        th {
          padding: 12px;
          text-align: left;
          border: 1px solid #e9d8b5;
          color: #6d4611;
          font-weight: 600;
          background-color: #f8f5ee;
        }

        td {
          padding: 12px;
          border: 1px solid #e9d8b5;
          color: #6d4611;
        }

        /* Estados de las filas */
        tr.bajo {
          background-color: #fff5f5;
        }

        tr.exceso {
          background-color: #f0fff4;
        }

        .producto-cell strong {
          display: block;
          color: #7a3b06;
        }

        .producto-cell small {
          color: #6d4611;
          opacity: 0.8;
          font-size: 12px;
        }

        .entrada-cell .badge.entrada {
          background-color: #e8f5e8;
          color: #28a745;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .salida-cell .badge.salida {
          background-color: #fee;
          color: #dc3545;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .stock-cell strong {
          color: #7a3b06;
          font-size: 16px;
        }

        .estado-cell .estado {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .estado.optimo {
          background-color: #e8f5e8;
          color: #28a745;
        }

        .estado.bajo {
          background-color: #fff5f5;
          color: #dc3545;
        }

        .estado.exceso {
          background-color: #fff3cd;
          color: #856404;
        }

        .observaciones-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .actions-cell {
          width: 140px;
        }

        .action-buttons-small {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .btn-view,
        .btn-edit,
        .btn-delete {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view {
          background-color: #17a2b8;
          color: white;
        }

        .btn-edit {
          background-color: #ffc107;
          color: #7a3b06;
        }

        .btn-delete {
          background-color: #dc3545;
          color: white;
        }

        .btn-view:hover,
        .btn-edit:hover,
        .btn-delete:hover {
          opacity: 0.8;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-success {
          background-color: #e8f5e8;
          color: #28a745;
        }

        .badge-danger {
          background-color: #fff5f5;
          color: #dc3545;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #6d4611;
          opacity: 0.7;
        }

        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }
          .search-filter-bar {
            flex-direction: column;
          }
          .filter-group {
            flex-direction: column;
          }
          .filter-select, .date-input {
            min-width: auto;
          }
          .detalle-card {
            grid-template-columns: 1fr;
          }
          .form-actions {
            flex-direction: column;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .action-buttons {
            flex-direction: column;
          }
          .modal {
            margin: 20px;
          }
          .modal.large {
            max-width: calc(100vw - 40px);
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}