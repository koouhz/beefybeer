// src/pages/Proveedores.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Package, 
  Search,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Save,
  Loader,
  RefreshCw,
  Mail,
  Building,
  Truck,
  Activity,
  Clock,
  MapPin,
  AlertCircle,
  Star,
  Award,
  Shield
} from "lucide-react";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedoresProductos, setProveedoresProductos] = useState([]);
  const [proveedoresContactos, setProveedoresContactos] = useState([]);
  const [proveedoresEvaluaciones, setProveedoresEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [showProductosModal, setShowProductosModal] = useState(false);
  const [showContactosModal, setShowContactosModal] = useState(false);
  const [showEvaluacionesModal, setShowEvaluacionesModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCalidad, setFiltroCalidad] = useState("todos");

  const [form, setForm] = useState({
    ci_proveedor: '',
    nombre_empresa: '',
    contacto_principal: '',
    descripcion: '',
    telefono: '',
    email: '',
    ruta_entrega: '',
    estado: 'activo'
  });

  const [productoForm, setProductoForm] = useState({
    id_producto: '',
    precio_proveedor: '',
    moneda: 'BOB',
    unidad_compra: '',
    stock_minimo_pedido: '',
    stock_maximo_pedido: '',
    calidad_producto: 'estandar'
  });

  const [contactoForm, setContactoForm] = useState({
    nombre_contacto: '',
    cargo: '',
    telefono: '',
    email: '',
    es_contacto_principal: false
  });

  const [evaluacionForm, setEvaluacionForm] = useState({
    puntuacion_calidad: 5,
    puntuacion_entrega: 5,
    puntuacion_precio: 5,
    puntuacion_servicio: 5,
    comentarios: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [productoFormErrors, setProductoFormErrors] = useState({});
  const [contactoFormErrors, setContactoFormErrors] = useState({});

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
        proveedoresRes, 
        productosRes, 
        proveedoresProductosRes,
        proveedoresContactosRes,
        proveedoresEvaluacionesRes
      ] = await Promise.all([
        supabase.from('proveedores').select('*').order('fecha_registro', { ascending: false }),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('proveedores_productos').select('*'),
        supabase.from('proveedores_contactos').select('*'),
        supabase.from('proveedores_evaluaciones').select('*')
      ]);
      
      const errors = [
        proveedoresRes.error, 
        productosRes.error, 
        proveedoresProductosRes.error,
        proveedoresContactosRes.error,
        proveedoresEvaluacionesRes.error
      ].filter(error => error);

      if (errors.length > 0) {
        throw new Error(`Errores al cargar: ${errors.map(e => e.message).join(', ')}`);
      }
      
      setProveedores(proveedoresRes.data || []);
      setProductos(productosRes.data || []);
      setProveedoresProductos(proveedoresProductosRes.data || []);
      setProveedoresContactos(proveedoresContactosRes.data || []);
      setProveedoresEvaluaciones(proveedoresEvaluacionesRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateProveedor = () => {
    const errors = {};

    if (!form.ci_proveedor.trim()) {
      errors.ci_proveedor = "El CI/NIT del proveedor es obligatorio";
    } else if (form.ci_proveedor.trim().length < 3) {
      errors.ci_proveedor = "El CI/NIT debe tener al menos 3 caracteres";
    }

    if (!form.nombre_empresa.trim()) {
      errors.nombre_empresa = "El nombre de la empresa es obligatorio";
    } else if (form.nombre_empresa.trim().length < 2) {
      errors.nombre_empresa = "El nombre debe tener al menos 2 caracteres";
    }

    if (!form.contacto_principal.trim()) {
      errors.contacto_principal = "El contacto principal es obligatorio";
    } else if (form.contacto_principal.trim().length < 2) {
      errors.contacto_principal = "El contacto debe tener al menos 2 caracteres";
    }

    if (!form.telefono.trim()) {
      errors.telefono = "El teléfono es obligatorio";
    } else if (form.telefono.trim().length < 6) {
      errors.telefono = "El teléfono debe tener al menos 6 caracteres";
    }

    if (!form.email.trim()) {
      errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "El email no es válido";
    }

    if (!form.descripcion.trim()) {
      errors.descripcion = "La descripción es obligatoria";
    } else if (form.descripcion.trim().length < 10) {
      errors.descripcion = "La descripción debe tener al menos 10 caracteres";
    }

    if (!form.ruta_entrega.trim()) {
      errors.ruta_entrega = "La ruta de entrega es obligatoria";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProducto = () => {
    const errors = {};

    if (!productoForm.id_producto) {
      errors.id_producto = "Debe seleccionar un producto";
    }

    if (!productoForm.precio_proveedor || parseFloat(productoForm.precio_proveedor) <= 0) {
      errors.precio_proveedor = "El precio debe ser mayor a 0";
    }

    if (!productoForm.unidad_compra.trim()) {
      errors.unidad_compra = "La unidad de compra es obligatoria";
    }

    if (!productoForm.stock_minimo_pedido || parseInt(productoForm.stock_minimo_pedido) < 0) {
      errors.stock_minimo_pedido = "El stock mínimo es obligatorio";
    }

    if (!productoForm.stock_maximo_pedido || parseInt(productoForm.stock_maximo_pedido) <= parseInt(productoForm.stock_minimo_pedido)) {
      errors.stock_maximo_pedido = "El stock máximo debe ser mayor al mínimo";
    }

    setProductoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateContacto = () => {
    const errors = {};

    if (!contactoForm.nombre_contacto.trim()) {
      errors.nombre_contacto = "El nombre del contacto es obligatorio";
    }

    if (!contactoForm.cargo.trim()) {
      errors.cargo = "El cargo es obligatorio";
    }

    if (!contactoForm.telefono.trim()) {
      errors.telefono = "El teléfono es obligatorio";
    }

    if (!contactoForm.email.trim()) {
      errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactoForm.email)) {
      errors.email = "El email no es válido";
    }

    setContactoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('guardar');
    
    try {
      if (!validateProveedor()) {
        showMessage("Por favor, corrige los errores en el formulario");
        setActionLoading(null);
        return;
      }

      const proveedorData = {
        ci_proveedor: form.ci_proveedor.trim(),
        nombre_empresa: form.nombre_empresa.trim(),
        contacto_principal: form.contacto_principal.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        descripcion: form.descripcion.trim(),
        ruta_entrega: form.ruta_entrega.trim(),
        estado: form.estado
      };

      let result;
      if (editingId) {
        result = await supabase
          .from('proveedores')
          .update(proveedorData)
          .eq('ci_proveedor', editingId);
      } else {
        // Verificar si ya existe un proveedor con el mismo CI/NIT
        const { data: existing } = await supabase
          .from('proveedores')
          .select('ci_proveedor')
          .eq('ci_proveedor', proveedorData.ci_proveedor)
          .single();

        if (existing) {
          throw new Error("Ya existe un proveedor con este CI/NIT");
        }

        result = await supabase
          .from('proveedores')
          .insert([proveedorData]);
      }
      
      if (result.error) throw result.error;

      showMessage(`Proveedor ${editingId ? 'actualizado' : 'creado'} exitosamente`, "success");
      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const agregarProductoProveedor = async () => {
    if (!proveedorSeleccionado) return;
    
    setActionLoading('agregar-producto');
    
    try {
      if (!validateProducto()) {
        showMessage("Por favor, corrige los errores en el formulario de producto");
        setActionLoading(null);
        return;
      }

      const productoData = {
        ci_proveedor: proveedorSeleccionado.ci_proveedor,
        id_producto: parseInt(productoForm.id_producto),
        precio_proveedor: parseFloat(productoForm.precio_proveedor),
        moneda: productoForm.moneda,
        unidad_compra: productoForm.unidad_compra.trim(),
        stock_minimo_pedido: parseInt(productoForm.stock_minimo_pedido),
        stock_maximo_pedido: parseInt(productoForm.stock_maximo_pedido),
        calidad_producto: productoForm.calidad_producto
      };

      const { error } = await supabase
        .from('proveedores_productos')
        .insert([productoData]);

      if (error) throw error;

      showMessage("Producto agregado al proveedor exitosamente", "success");
      setProductoForm({
        id_producto: '',
        precio_proveedor: '',
        moneda: 'BOB',
        unidad_compra: '',
        stock_minimo_pedido: '',
        stock_maximo_pedido: '',
        calidad_producto: 'estandar'
      });
      setProductoFormErrors({});
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const agregarContactoProveedor = async () => {
    if (!proveedorSeleccionado) return;
    
    setActionLoading('agregar-contacto');
    
    try {
      if (!validateContacto()) {
        showMessage("Por favor, corrige los errores en el formulario de contacto");
        setActionLoading(null);
        return;
      }

      const contactoData = {
        ci_proveedor: proveedorSeleccionado.ci_proveedor,
        nombre_contacto: contactoForm.nombre_contacto.trim(),
        cargo: contactoForm.cargo.trim(),
        telefono: contactoForm.telefono.trim(),
        email: contactoForm.email.trim(),
        es_contacto_principal: contactoForm.es_contacto_principal
      };

      const { error } = await supabase
        .from('proveedores_contactos')
        .insert([contactoData]);

      if (error) throw error;

      showMessage("Contacto agregado al proveedor exitosamente", "success");
      setContactoForm({
        nombre_contacto: '',
        cargo: '',
        telefono: '',
        email: '',
        es_contacto_principal: false
      });
      setContactoFormErrors({});
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const agregarEvaluacionProveedor = async () => {
    if (!proveedorSeleccionado) return;
    
    setActionLoading('agregar-evaluacion');
    
    try {
      const evaluacionData = {
        ci_proveedor: proveedorSeleccionado.ci_proveedor,
        puntuacion_calidad: parseInt(evaluacionForm.puntuacion_calidad),
        puntuacion_entrega: parseInt(evaluacionForm.puntuacion_entrega),
        puntuacion_precio: parseInt(evaluacionForm.puntuacion_precio),
        puntuacion_servicio: parseInt(evaluacionForm.puntuacion_servicio),
        comentarios: evaluacionForm.comentarios.trim() || null,
        evaluado_por: 'Sistema' // En una app real, sería el usuario logueado
      };

      const { error } = await supabase
        .from('proveedores_evaluaciones')
        .insert([evaluacionData]);

      if (error) throw error;

      showMessage("Evaluación agregada exitosamente", "success");
      setEvaluacionForm({
        puntuacion_calidad: 5,
        puntuacion_entrega: 5,
        puntuacion_precio: 5,
        puntuacion_servicio: 5,
        comentarios: ''
      });
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarProveedor = async (ci) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor? Se eliminarán todos sus productos, contactos y evaluaciones asociadas.')) {
      return;
    }

    setActionLoading(`delete-${ci}`);
    
    try {
      // Eliminar en cascada
      const { error: errorProductos } = await supabase
        .from('proveedores_productos')
        .delete()
        .eq('ci_proveedor', ci);

      if (errorProductos) throw errorProductos;

      const { error: errorContactos } = await supabase
        .from('proveedores_contactos')
        .delete()
        .eq('ci_proveedor', ci);

      if (errorContactos) throw errorContactos;

      const { error: errorEvaluaciones } = await supabase
        .from('proveedores_evaluaciones')
        .delete()
        .eq('ci_proveedor', ci);

      if (errorEvaluaciones) throw errorEvaluaciones;

      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('ci_proveedor', ci);

      if (error) throw error;
      
      showMessage("Proveedor eliminado exitosamente", "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al eliminar proveedor: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarProductoProveedor = async (idProveedorProducto) => {
    if (!window.confirm('¿Eliminar este producto del proveedor?')) {
      return;
    }

    setActionLoading(`delete-producto-${idProveedorProducto}`);
    
    try {
      const { error } = await supabase
        .from('proveedores_productos')
        .delete()
        .eq('id_proveedor_producto', idProveedorProducto);

      if (error) throw error;
      
      showMessage("Producto eliminado del proveedor", "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al eliminar producto: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarContactoProveedor = async (idContacto) => {
    if (!window.confirm('¿Eliminar este contacto?')) {
      return;
    }

    setActionLoading(`delete-contacto-${idContacto}`);
    
    try {
      const { error } = await supabase
        .from('proveedores_contactos')
        .delete()
        .eq('id_contacto', idContacto);

      if (error) throw error;
      
      showMessage("Contacto eliminado", "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al eliminar contacto: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getPromedioEvaluaciones = (ci_proveedor) => {
    const evaluaciones = proveedoresEvaluaciones.filter(ev => ev.ci_proveedor === ci_proveedor);
    if (evaluaciones.length === 0) return 0;
    
    const total = evaluaciones.reduce((sum, evaluacion) => 
      sum + evaluacion.puntuacion_calidad + evaluacion.puntuacion_entrega + evaluacion.puntuacion_precio + evaluacion.puntuacion_servicio, 0);
    
    return (total / (evaluaciones.length * 4)).toFixed(1);
  };

  const resetForm = () => {
    setForm({ 
      ci_proveedor: '',
      nombre_empresa: '',
      contacto_principal: '',
      telefono: '',
      email: '',
      descripcion: '',
      ruta_entrega: '',
      estado: 'activo'
    });
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const resetFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("todos");
    setFiltroCalidad("todos");
  };

  const getProductosProveedor = (ci_proveedor) => {
    return proveedoresProductos.filter(pp => pp.ci_proveedor === ci_proveedor);
  };

  const getContactosProveedor = (ci_proveedor) => {
    return proveedoresContactos.filter(pc => pc.ci_proveedor === ci_proveedor);
  };

  const getEvaluacionesProveedor = (ci_proveedor) => {
    return proveedoresEvaluaciones.filter(pe => pe.ci_proveedor === ci_proveedor);
  };

  const getProductoNombre = (id_producto) => {
    const producto = productos.find(p => p.id_producto === id_producto);
    return producto ? producto.nombre : 'Producto no encontrado';
  };

  const filteredProveedores = proveedores.filter(proveedor => {
    const matchesSearch = 
      proveedor.ci_proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.contacto_principal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.ruta_entrega?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = filtroEstado === "todos" || proveedor.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const estadisticas = {
    totalProveedores: proveedores.length,
    proveedoresActivos: proveedores.filter(p => p.estado === 'activo').length,
    totalProductosAsociados: proveedoresProductos.length,
    totalEvaluaciones: proveedoresEvaluaciones.length
  };

  const ErrorMessage = ({ error }) => (
    error ? (
      <div className="error-message">
        <AlertCircle size={12} />
        <span>{error}</span>
      </div>
    ) : null
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={32} className="spinner" />
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Building size={32} />
            <div>
              <h1>Gestión de Proveedores</h1>
              <p>Administra proveedores, productos asociados y contactos</p>
            </div>
          </div>
          <button 
            onClick={cargarDatos}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinner' : ''} />
            Actualizar
          </button>
        </div>
      </header>

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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Building size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{estadisticas.totalProveedores}</div>
            <div className="stat-label">Total Proveedores</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{estadisticas.proveedoresActivos}</div>
            <div className="stat-label">Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{estadisticas.totalProductosAsociados}</div>
            <div className="stat-label">Productos Asoc.</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <Star size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{estadisticas.totalEvaluaciones}</div>
            <div className="stat-label">Evaluaciones</div>
          </div>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por CI/NIT, empresa, contacto o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
          </select>

          <button 
            onClick={resetFiltros}
            className="btn btn-outline"
          >
            <X size={16} />
            Limpiar
          </button>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn btn-primary"
        >
          <Plus size={16} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="table-title">
            <Building size={20} />
            <h2>Proveedores ({filteredProveedores.length})</h2>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>CI/NIT</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Información</th>
                <th>Productos</th>
                <th>Evaluación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProveedores.map(proveedor => {
                const productosCount = getProductosProveedor(proveedor.ci_proveedor).length;
                const contactosCount = getContactosProveedor(proveedor.ci_proveedor).length;
                const promedioEvaluacion = getPromedioEvaluaciones(proveedor.ci_proveedor);
                
                return (
                  <tr key={proveedor.ci_proveedor}>
                    <td className="id-cell">
                      <div style={{ fontWeight: "600", color: "#7a3b06" }}>
                        {proveedor.ci_proveedor}
                      </div>
                    </td>
                    <td className="name-cell">
                      <div>
                        <div style={{ fontWeight: "600", color: "#7a3b06", fontSize: "16px" }}>
                          {proveedor.nombre_empresa}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                          {proveedor.fecha_registro ? new Date(proveedor.fecha_registro).toLocaleDateString('es-BO') : 'Sin fecha'}
                        </div>
                      </div>
                    </td>
                    <td className="contact-cell">
                      <div>
                        <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                          {proveedor.contacto_principal}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                          {contactosCount} contacto{contactosCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="info-cell">
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {proveedor.telefono && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                            <Phone size={12} />
                            {proveedor.telefono}
                          </div>
                        )}
                        {proveedor.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                            <Mail size={12} />
                            {proveedor.email}
                          </div>
                        )}
                        {proveedor.ruta_entrega && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                            <MapPin size={12} />
                            {proveedor.ruta_entrega}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="products-cell">
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div className="product-count">
                          <Package size={12} />
                          {productosCount} producto{productosCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="rating-cell">
                      {promedioEvaluacion > 0 ? (
                        <div className="rating-badge">
                          <Star size={12} fill="currentColor" />
                          {promedioEvaluacion}/5
                        </div>
                      ) : (
                        <div className="rating-badge no-rating">
                          Sin evaluar
                        </div>
                      )}
                    </td>
                    <td className="status-cell">
                      <div className={`status-badge ${proveedor.estado}`}>
                        {proveedor.estado === 'activo' ? <CheckCircle size={12} /> : 
                         proveedor.estado === 'inactivo' ? <Clock size={12} /> : <XCircle size={12} />}
                        {proveedor.estado}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons-small">
                        <button
                          onClick={() => {
                            setForm({
                              ci_proveedor: proveedor.ci_proveedor || '',
                              nombre_empresa: proveedor.nombre_empresa || '',
                              contacto_principal: proveedor.contacto_principal || '',
                              telefono: proveedor.telefono || '',
                              email: proveedor.email || '',
                              descripcion: proveedor.descripcion || '',
                              ruta_entrega: proveedor.ruta_entrega || '',
                              estado: proveedor.estado || 'activo'
                            });
                            setEditingId(proveedor.ci_proveedor);
                            setShowForm(true);
                          }}
                          className="btn-edit"
                          title="Editar proveedor"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowProductosModal(true);
                          }}
                          className="btn-info"
                          title="Gestionar productos"
                        >
                          <Package size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowContactosModal(true);
                          }}
                          className="btn-secondary"
                          title="Gestionar contactos"
                        >
                          <User size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowEvaluacionesModal(true);
                          }}
                          className="btn-warning"
                          title="Evaluar proveedor"
                        >
                          <Star size={14} />
                        </button>
                        <button
                          onClick={() => eliminarProveedor(proveedor.ci_proveedor)}
                          className="btn-delete"
                          disabled={actionLoading === `delete-${proveedor.ci_proveedor}`}
                          title="Eliminar proveedor"
                        >
                          {actionLoading === `delete-${proveedor.ci_proveedor}` ? (
                            <Loader size={14} className="spinner" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProveedores.length === 0 && (
            <div className="empty-state">
              <Building size={48} />
              <p>No se encontraron proveedores</p>
              <button 
                onClick={resetFiltros}
                className="btn btn-outline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>
                {editingId ? (
                  <>
                    <Edit size={20} />
                    Editar Proveedor
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Nuevo Proveedor
                  </>
                )}
              </h3>
              <button onClick={resetForm} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-section">
                <h4>
                  <Building size={16} />
                  Información Básica
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      CI/NIT del Proveedor *
                      {formErrors.ci_proveedor && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="text"
                      value={form.ci_proveedor}
                      onChange={(e) => setForm({...form, ci_proveedor: e.target.value})}
                      className={`form-input ${formErrors.ci_proveedor ? 'error' : ''}`}
                      required
                      minLength="3"
                      maxLength="20"
                      placeholder="Número de CI o NIT"
                    />
                    <ErrorMessage error={formErrors.ci_proveedor} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Nombre de Empresa *
                      {formErrors.nombre_empresa && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="text"
                      value={form.nombre_empresa}
                      onChange={(e) => setForm({...form, nombre_empresa: e.target.value})}
                      className={`form-input ${formErrors.nombre_empresa ? 'error' : ''}`}
                      required
                      minLength="2"
                      maxLength="100"
                      placeholder="Nombre legal de la empresa"
                    />
                    <ErrorMessage error={formErrors.nombre_empresa} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Contacto Principal *
                      {formErrors.contacto_principal && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="text"
                      value={form.contacto_principal}
                      onChange={(e) => setForm({...form, contacto_principal: e.target.value})}
                      className={`form-input ${formErrors.contacto_principal ? 'error' : ''}`}
                      required
                      minLength="2"
                      maxLength="100"
                      placeholder="Persona principal de contacto"
                    />
                    <ErrorMessage error={formErrors.contacto_principal} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Teléfono *
                      {formErrors.telefono && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm({...form, telefono: e.target.value})}
                      className={`form-input ${formErrors.telefono ? 'error' : ''}`}
                      required
                      minLength="6"
                      placeholder="+591 XXX XXX"
                    />
                    <ErrorMessage error={formErrors.telefono} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Email *
                      {formErrors.email && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className={`form-input ${formErrors.email ? 'error' : ''}`}
                      required
                      placeholder="proveedor@empresa.com"
                    />
                    <ErrorMessage error={formErrors.email} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Ruta de Entrega *
                      {formErrors.ruta_entrega && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="text"
                      value={form.ruta_entrega}
                      onChange={(e) => setForm({...form, ruta_entrega: e.target.value})}
                      className={`form-input ${formErrors.ruta_entrega ? 'error' : ''}`}
                      required
                      placeholder="Zona o ruta de entrega"
                    />
                    <ErrorMessage error={formErrors.ruta_entrega} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Descripción *
                    {formErrors.descripcion && <span className="error-indicator">!</span>}
                  </label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({...form, descripcion: e.target.value})}
                    className={`form-input ${formErrors.descripcion ? 'error' : ''}`}
                    placeholder="Descripción detallada del proveedor..."
                    rows="3"
                    maxLength="500"
                    required
                    minLength="10"
                  />
                  <ErrorMessage error={formErrors.descripcion} />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({...form, estado: e.target.value})}
                    className="form-input"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={actionLoading === 'guardar'}
                >
                  {actionLoading === 'guardar' ? (
                    <>
                      <Loader size={16} className="spinner" />
                      {editingId ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId ? "Actualizar" : "Crear Proveedor"}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="btn btn-cancel"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductosModal && proveedorSeleccionado && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>
                <Package size={20} />
                Productos de {proveedorSeleccionado.nombre_empresa}
              </h3>
              <button onClick={() => setShowProductosModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-section">
                <h4>
                  <Plus size={16} />
                  Agregar Producto
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Producto *
                      {productoFormErrors.id_producto && <span className="error-indicator">!</span>}
                    </label>
                    <select
                      value={productoForm.id_producto}
                      onChange={(e) => setProductoForm({...productoForm, id_producto: e.target.value})}
                      className={`form-input ${productoFormErrors.id_producto ? 'error' : ''}`}
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {productos.map(producto => (
                        <option key={producto.id_producto} value={producto.id_producto}>
                          {producto.nombre}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage error={productoFormErrors.id_producto} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Precio *
                      {productoFormErrors.precio_proveedor && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={productoForm.precio_proveedor}
                      onChange={(e) => setProductoForm({...productoForm, precio_proveedor: e.target.value})}
                      className={`form-input ${productoFormErrors.precio_proveedor ? 'error' : ''}`}
                      placeholder="0.00"
                      required
                    />
                    <ErrorMessage error={productoFormErrors.precio_proveedor} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Moneda</label>
                    <select
                      value={productoForm.moneda}
                      onChange={(e) => setProductoForm({...productoForm, moneda: e.target.value})}
                      className="form-input"
                    >
                      <option value="BOB">BOB</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Unidad de Compra *
                      {productoFormErrors.unidad_compra && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="text"
                      value={productoForm.unidad_compra}
                      onChange={(e) => setProductoForm({...productoForm, unidad_compra: e.target.value})}
                      className={`form-input ${productoFormErrors.unidad_compra ? 'error' : ''}`}
                      placeholder="kg, litros, cajas..."
                      required
                    />
                    <ErrorMessage error={productoFormErrors.unidad_compra} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Stock Mínimo *
                      {productoFormErrors.stock_minimo_pedido && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productoForm.stock_minimo_pedido}
                      onChange={(e) => setProductoForm({...productoForm, stock_minimo_pedido: e.target.value})}
                      className={`form-input ${productoFormErrors.stock_minimo_pedido ? 'error' : ''}`}
                      placeholder="0"
                      required
                    />
                    <ErrorMessage error={productoFormErrors.stock_minimo_pedido} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Stock Máximo *
                      {productoFormErrors.stock_maximo_pedido && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productoForm.stock_maximo_pedido}
                      onChange={(e) => setProductoForm({...productoForm, stock_maximo_pedido: e.target.value})}
                      className={`form-input ${productoFormErrors.stock_maximo_pedido ? 'error' : ''}`}
                      placeholder="100"
                      required
                    />
                    <ErrorMessage error={productoFormErrors.stock_maximo_pedido} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Calidad del Producto</label>
                  <select
                    value={productoForm.calidad_producto}
                    onChange={(e) => setProductoForm({...productoForm, calidad_producto: e.target.value})}
                    className="form-input"
                  >
                    <option value="premium">Premium</option>
                    <option value="estandar">Estándar</option>
                    <option value="economico">Económico</option>
                  </select>
                </div>

                <button
                  onClick={agregarProductoProveedor}
                  disabled={actionLoading === 'agregar-producto'}
                  className="btn btn-success"
                >
                  {actionLoading === 'agregar-producto' ? (
                    <>
                      <Loader size={14} className="spinner" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Agregar Producto
                    </>
                  )}
                </button>
              </div>

              <div className="list-section">
                <h4>
                  <Package size={16} />
                  Productos Asociados ({getProductosProveedor(proveedorSeleccionado.ci_proveedor).length})
                </h4>
                {getProductosProveedor(proveedorSeleccionado.ci_proveedor).length > 0 ? (
                  <div className="items-list">
                    {getProductosProveedor(proveedorSeleccionado.ci_proveedor).map(pp => (
                      <div key={pp.id_proveedor_producto} className="item-card">
                        <div className="item-info">
                          <div className="item-name">{getProductoNombre(pp.id_producto)}</div>
                          <div className="item-details">
                            <span className="price">
                              {new Intl.NumberFormat('es-BO', { 
                                style: 'currency', 
                                currency: pp.moneda 
                              }).format(pp.precio_proveedor)}
                            </span>
                            <span className="unit">• {pp.unidad_compra}</span>
                            <span className="stock">• Stock: {pp.stock_minimo_pedido}-{pp.stock_maximo_pedido}</span>
                            <span className={`quality ${pp.calidad_producto}`}>
                              • {pp.calidad_producto}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => eliminarProductoProveedor(pp.id_proveedor_producto)}
                          className="btn-delete-small"
                          disabled={actionLoading === `delete-producto-${pp.id_proveedor_producto}`}
                        >
                          {actionLoading === `delete-producto-${pp.id_proveedor_producto}` ? (
                            <Loader size={12} className="spinner" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <Package size={32} />
                    <p>No hay productos asociados</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowProductosModal(false)}
                className="btn btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactosModal && proveedorSeleccionado && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <User size={20} />
                Contactos de {proveedorSeleccionado.nombre_empresa}
              </h3>
              <button onClick={() => setShowContactosModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-section">
                <h4>
                  <Plus size={16} />
                  Agregar Contacto
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Nombre *
                      {contactoFormErrors.nombre_contacto && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="text"
                      value={contactoForm.nombre_contacto}
                      onChange={(e) => setContactoForm({...contactoForm, nombre_contacto: e.target.value})}
                      className={`form-input ${contactoFormErrors.nombre_contacto ? 'error' : ''}`}
                      placeholder="Nombre completo"
                      required
                    />
                    <ErrorMessage error={contactoFormErrors.nombre_contacto} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Cargo *
                      {contactoFormErrors.cargo && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="text"
                      value={contactoForm.cargo}
                      onChange={(e) => setContactoForm({...contactoForm, cargo: e.target.value})}
                      className={`form-input ${contactoFormErrors.cargo ? 'error' : ''}`}
                      placeholder="Cargo o posición"
                      required
                    />
                    <ErrorMessage error={contactoFormErrors.cargo} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Teléfono *
                      {contactoFormErrors.telefono && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="tel"
                      value={contactoForm.telefono}
                      onChange={(e) => setContactoForm({...contactoForm, telefono: e.target.value})}
                      className={`form-input ${contactoFormErrors.telefono ? 'error' : ''}`}
                      placeholder="+591 XXX XXX"
                      required
                    />
                    <ErrorMessage error={contactoFormErrors.telefono} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Email *
                      {contactoFormErrors.email && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="email"
                      value={contactoForm.email}
                      onChange={(e) => setContactoForm({...contactoForm, email: e.target.value})}
                      className={`form-input ${contactoFormErrors.email ? 'error' : ''}`}
                      placeholder="contacto@empresa.com"
                      required
                    />
                    <ErrorMessage error={contactoFormErrors.email} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={contactoForm.es_contacto_principal}
                      onChange={(e) => setContactoForm({...contactoForm, es_contacto_principal: e.target.checked})}
                    />
                    <span>Contacto principal</span>
                  </label>
                </div>

                <button
                  onClick={agregarContactoProveedor}
                  disabled={actionLoading === 'agregar-contacto'}
                  className="btn btn-success"
                >
                  {actionLoading === 'agregar-contacto' ? (
                    <>
                      <Loader size={14} className="spinner" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Agregar Contacto
                    </>
                  )}
                </button>
              </div>

              <div className="list-section">
                <h4>
                  <User size={16} />
                  Contactos Asociados ({getContactosProveedor(proveedorSeleccionado.ci_proveedor).length})
                </h4>
                {getContactosProveedor(proveedorSeleccionado.ci_proveedor).length > 0 ? (
                  <div className="items-list">
                    {getContactosProveedor(proveedorSeleccionado.ci_proveedor).map(contacto => (
                      <div key={contacto.id_contacto} className="item-card">
                        <div className="item-info">
                          <div className="item-header">
                            <span className="item-name">{contacto.nombre_contacto}</span>
                            {contacto.es_contacto_principal && (
                              <span className="badge-primary">Principal</span>
                            )}
                          </div>
                          <div className="item-details">
                            <span className="cargo">{contacto.cargo}</span>
                            <div className="contact-info">
                              <span className="phone">
                                <Phone size={12} />
                                {contacto.telefono}
                              </span>
                              <span className="email">
                                <Mail size={12} />
                                {contacto.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => eliminarContactoProveedor(contacto.id_contacto)}
                          className="btn-delete-small"
                          disabled={actionLoading === `delete-contacto-${contacto.id_contacto}`}
                        >
                          {actionLoading === `delete-contacto-${contacto.id_contacto}` ? (
                            <Loader size={12} className="spinner" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <User size={32} />
                    <p>No hay contactos asociados</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowContactosModal(false)}
                className="btn btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEvaluacionesModal && proveedorSeleccionado && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <Star size={20} />
                Evaluar a {proveedorSeleccionado.nombre_empresa}
              </h3>
              <button onClick={() => setShowEvaluacionesModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-section">
                <h4>
                  <Award size={16} />
                  Nueva Evaluación
                </h4>
                
                <div className="rating-grid">
                  <div className="rating-item">
                    <label className="form-label">Calidad del Producto</label>
                    <select
                      value={evaluacionForm.puntuacion_calidad}
                      onChange={(e) => setEvaluacionForm({...evaluacionForm, puntuacion_calidad: e.target.value})}
                      className="form-input"
                    >
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num}>
                          {num} ★ - {num === 1 ? 'Muy mala' : num === 2 ? 'Mala' : num === 3 ? 'Regular' : num === 4 ? 'Buena' : 'Excelente'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="rating-item">
                    <label className="form-label">Puntualidad en Entrega</label>
                    <select
                      value={evaluacionForm.puntuacion_entrega}
                      onChange={(e) => setEvaluacionForm({...evaluacionForm, puntuacion_entrega: e.target.value})}
                      className="form-input"
                    >
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num}>
                          {num} ★ - {num === 1 ? 'Muy mala' : num === 2 ? 'Mala' : num === 3 ? 'Regular' : num === 4 ? 'Buena' : 'Excelente'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="rating-item">
                    <label className="form-label">Precio Competitivo</label>
                    <select
                      value={evaluacionForm.puntuacion_precio}
                      onChange={(e) => setEvaluacionForm({...evaluacionForm, puntuacion_precio: e.target.value})}
                      className="form-input"
                    >
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num}>
                          {num} ★ - {num === 1 ? 'Muy malo' : num === 2 ? 'Malo' : num === 3 ? 'Regular' : num === 4 ? 'Bueno' : 'Excelente'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="rating-item">
                    <label className="form-label">Servicio al Cliente</label>
                    <select
                      value={evaluacionForm.puntuacion_servicio}
                      onChange={(e) => setEvaluacionForm({...evaluacionForm, puntuacion_servicio: e.target.value})}
                      className="form-input"
                    >
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num}>
                          {num} ★ - {num === 1 ? 'Muy malo' : num === 2 ? 'Malo' : num === 3 ? 'Regular' : num === 4 ? 'Bueno' : 'Excelente'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Comentarios</label>
                  <textarea
                    value={evaluacionForm.comentarios}
                    onChange={(e) => setEvaluacionForm({...evaluacionForm, comentarios: e.target.value})}
                    className="form-input"
                    placeholder="Comentarios adicionales sobre el proveedor..."
                    rows="3"
                  />
                </div>

                <button
                  onClick={agregarEvaluacionProveedor}
                  disabled={actionLoading === 'agregar-evaluacion'}
                  className="btn btn-success"
                >
                  {actionLoading === 'agregar-evaluacion' ? (
                    <>
                      <Loader size={14} className="spinner" />
                      Evaluando...
                    </>
                  ) : (
                    <>
                      <Star size={14} />
                      Agregar Evaluación
                    </>
                  )}
                </button>
              </div>

              <div className="list-section">
                <h4>
                  <Shield size={16} />
                  Historial de Evaluaciones ({getEvaluacionesProveedor(proveedorSeleccionado.ci_proveedor).length})
                </h4>
                {getEvaluacionesProveedor(proveedorSeleccionado.ci_proveedor).length > 0 ? (
                  <div className="items-list">
                    {getEvaluacionesProveedor(proveedorSeleccionado.ci_proveedor).map(evaluacion => {
                      const promedio = (
                        (evaluacion.puntuacion_calidad + evaluacion.puntuacion_entrega + evaluacion.puntuacion_precio + evaluacion.puntuacion_servicio) / 4
                      ).toFixed(1);
                      
                      return (
                        <div key={evaluacion.id_evaluacion} className="item-card">
                          <div className="item-info">
                            <div className="item-header">
                              <span className="item-name">
                                Evaluación del {new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-BO')}
                              </span>
                              <span className="rating-badge">
                                <Star size={12} fill="currentColor" />
                                {promedio}/5
                              </span>
                            </div>
                            <div className="rating-details">
                              <span>Calidad: {evaluacion.puntuacion_calidad}★</span>
                              <span>Entrega: {evaluacion.puntuacion_entrega}★</span>
                              <span>Precio: {evaluacion.puntuacion_precio}★</span>
                              <span>Servicio: {evaluacion.puntuacion_servicio}★</span>
                            </div>
                            {evaluacion.comentarios && (
                              <div className="comments">
                                {evaluacion.comentarios}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <Shield size={32} />
                    <p>No hay evaluaciones registradas</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowEvaluacionesModal(false)}
                className="btn btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-title {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .header-title h1 {
          font-size: 28px;
          color: #7a3b06;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .header-title p {
          color: #6d4611;
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
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

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
        }

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
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          padding: 12px;
          border-radius: 8px;
        }

        .stat-icon.primary {
          background: #f8f5ee;
          color: #7a3b06;
        }

        .stat-icon.secondary {
          background: #e3f2fd;
          color: #1976d2;
        }

        .stat-icon.success {
          background: #e8f5e8;
          color: #28a745;
        }

        .stat-icon.warning {
          background: #fff3cd;
          color: #856404;
        }

        .stat-icon.info {
          background: #f3e5f5;
          color: #7b1fa2;
        }

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

        .search-filter-bar {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          margin-bottom: 24px;
        }

        .search-section {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 300px;
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

        .filter-select {
          padding: 12px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
          min-width: 180px;
          background: white;
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

        .btn-outline {
          background: transparent;
          border: 1px solid #7a3b06;
          color: #7a3b06;
        }

        .btn-outline:hover {
          background: #7a3b06;
          color: white;
        }

        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

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
          justify-content: space-between;
          background-color: #f8f5ee;
        }

        .table-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .table-title h2 {
          color: #7a3b06;
          margin: 0;
          font-size: 18px;
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

        .id-cell {
          font-weight: 600;
          color: #7a3b06;
        }

        .name-cell strong {
          display: block;
          color: #7a3b06;
        }

        .name-cell small {
          color: #6d4611;
          opacity: 0.8;
        }

        .contact-cell, .info-cell, .products-cell {
          font-weight: 500;
        }

        .product-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #e8f5e8;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: #28a745;
        }

        .rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #fff3cd;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: #856404;
        }

        .rating-badge.no-rating {
          background: #f8f9fa;
          color: #6c757d;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.activo {
          background: #e8f5e8;
          color: #28a745;
        }

        .status-badge.inactivo {
          background: #f8f9fa;
          color: #6c757d;
        }

        .status-badge.suspendido {
          background: #f8d7da;
          color: #dc3545;
        }

        .actions-cell {
          width: 200px;
        }

        .action-buttons-small {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .btn-edit,
        .btn-delete,
        .btn-info,
        .btn-secondary,
        .btn-warning {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-edit {
          background-color: #ffc107;
          color: #7a3b06;
        }

        .btn-info {
          background-color: #17a2b8;
          color: white;
        }

        .btn-secondary {
          background-color: #6f42c1;
          color: white;
        }

        .btn-warning {
          background-color: #fd7e14;
          color: white;
        }

        .btn-delete {
          background-color: #dc3545;
          color: white;
        }

        .btn-edit:hover,
        .btn-info:hover,
        .btn-secondary:hover,
        .btn-warning:hover,
        .btn-delete:hover {
          opacity: 0.8;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #6d4611;
          opacity: 0.7;
        }

        .empty-state .btn {
          margin-top: 12px;
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

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e9d8b5;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          color: #7a3b06;
          margin: 0;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6d4611;
          padding: 5px;
        }

        .modal-content {
          padding: 24px;
        }

        .form-container {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-section h4 {
          color: #7a3b06;
          margin-bottom: 16px;
          font-size: 16px;
          border-bottom: 1px solid #e9d8b5;
          padding-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          color: #6d4611;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #7a3b06;
        }

        .form-input.error {
          border-color: #dc3545;
          background-color: #fff5f5;
        }

        .error-indicator {
          color: #dc3545;
          font-weight: bold;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
          color: #dc3545;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e9d8b5;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #6d4611;
        }

        .list-section {
          margin-top: 24px;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          background: white;
        }

        .item-info {
          flex: 1;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .item-name {
          font-weight: 500;
          color: #7a3b06;
        }

        .item-details {
          font-size: 12px;
          color: #6d4611;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .price {
          font-weight: 600;
          color: #28a745;
        }

        .quality.premium {
          color: #ff6b00;
          font-weight: 500;
        }

        .quality.estandar {
          color: #17a2b8;
        }

        .quality.economico {
          color: #6c757d;
        }

        .badge-primary {
          padding: 2px 6px;
          background: #e8f5e8;
          color: #28a745;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 4px;
        }

        .phone, .email {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
        }

        .btn-delete-small {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          background-color: #dc3545;
          color: white;
        }

        .empty-state-small {
          padding: 40px 20px;
          text-align: center;
          color: #6d4611;
          opacity: 0.7;
        }

        .modal-actions {
          padding: 16px 24px;
          border-top: 1px solid #e9d8b5;
          display: flex;
          gap: 12px;
        }

        .rating-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .rating-item {
          margin-bottom: 12px;
        }

        .rating-details {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #6d4611;
          margin-top: 4px;
        }

        .comments {
          margin-top: 8px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 12px;
          color: #495057;
          border-left: 3px solid #6c757d;
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .search-section {
            flex-direction: column;
          }
          .search-box {
            min-width: auto;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .form-actions {
            flex-direction: column;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .modal {
            margin: 20px;
          }
          .modal.large {
            max-width: calc(100vw - 40px);
          }
          .rating-grid {
            grid-template-columns: 1fr;
          }
          .action-buttons {
            flex-direction: column;
          }
          .action-buttons .btn {
            justify-content: center;
          }
          .action-buttons-small {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}