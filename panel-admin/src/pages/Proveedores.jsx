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
  Clock
} from "lucide-react";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedoresProductos, setProveedoresProductos] = useState([]);
  const [proveedoresContactos, setProveedoresContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [showProductosModal, setShowProductosModal] = useState(false);
  const [showContactosModal, setShowContactosModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [form, setForm] = useState({
    ci_proveedor: '',
    nombre_empresa: '',
    contacto_principal: '',
    descripcion: '',
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
      ] = await Promise.all([
        supabase.from('proveedores').select('*').order('fecha_registro', { ascending: false }),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('proveedores_productos').select('*'),
        supabase.from('proveedores_contactos').select('*'),
      ]);
      
      const errors = [
        proveedoresRes.error, 
        productosRes.error, 
        proveedoresProductosRes.error,
        proveedoresContactosRes.error,
      ].filter(error => error);

      if (errors.length > 0) {
        throw new Error(`Errores al cargar: ${errors.map(e => e.message).join(', ')}`);
      }
      
      setProveedores(proveedoresRes.data || []);
      setProductos(productosRes.data || []);
      setProveedoresProductos(proveedoresProductosRes.data || []);
      setProveedoresContactos(proveedoresContactosRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateProveedor = (proveedorData) => {
    const errors = [];

    if (!proveedorData.ci_proveedor || proveedorData.ci_proveedor.trim().length < 2) {
      errors.push("El CI/NIT del proveedor es requerido");
    }

    if (!proveedorData.nombre_empresa || proveedorData.nombre_empresa.trim().length < 2) {
      errors.push("El nombre de la empresa debe tener al menos 2 caracteres");
    }

    if (!proveedorData.contacto_principal || proveedorData.contacto_principal.trim().length < 2) {
      errors.push("El contacto principal debe tener al menos 2 caracteres");
    }

    if (!proveedorData.descripcion || proveedorData.descripcion.trim().length < 10) {
      errors.push("La descripción es obligatoria y debe tener al menos 10 caracteres");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('guardar');
    
    try {
      const proveedorData = {
        ci_proveedor: form.ci_proveedor.trim(),
        nombre_empresa: form.nombre_empresa.trim(),
        contacto_principal: form.contacto_principal.trim(),
        descripcion: form.descripcion.trim(),
        ruta_entrega: form.ruta_entrega.trim() || null,
        estado: form.estado
      };

      validateProveedor(proveedorData);

      let result;
      if (editingId) {
        result = await supabase
          .from('proveedores')
          .update(proveedorData)
          .eq('ci_proveedor', editingId);
      } else {
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
      const productoData = {
        ci_proveedor: proveedorSeleccionado.ci_proveedor,
        id_producto: parseInt(productoForm.id_producto),
        precio_proveedor: parseFloat(productoForm.precio_proveedor),
        moneda: productoForm.moneda,
        unidad_compra: productoForm.unidad_compra.trim(),
        stock_minimo_pedido: productoForm.stock_minimo_pedido ? parseInt(productoForm.stock_minimo_pedido) : null,
        stock_maximo_pedido: productoForm.stock_maximo_pedido ? parseInt(productoForm.stock_maximo_pedido) : null,
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
      if (!contactoForm.nombre_contacto.trim()) {
        throw new Error("El nombre del contacto es obligatorio");
      }
      if (!contactoForm.cargo.trim()) {
        throw new Error("El cargo del contacto es obligatorio");
      }
      if (!contactoForm.telefono.trim()) {
        throw new Error("El teléfono del contacto es obligatorio");
      }

      const contactoData = {
        ci_proveedor: proveedorSeleccionado.ci_proveedor,
        nombre_contacto: contactoForm.nombre_contacto.trim(),
        cargo: contactoForm.cargo.trim(),
        telefono: contactoForm.telefono.trim(),
        email: contactoForm.email.trim() || null,
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
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarProveedor = async (ci) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor? Se eliminarán todos sus productos y contactos asociados.')) {
      return;
    }

    setActionLoading(`delete-${ci}`);
    
    try {
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

  const resetForm = () => {
    setForm({ 
      ci_proveedor: '',
      nombre_empresa: '',
      contacto_principal: '',
      descripcion: '',
      ruta_entrega: '',
      estado: 'activo'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const resetFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("todos");
  };

  const getProductosProveedor = (ci_proveedor) => {
    return proveedoresProductos.filter(pp => pp.ci_proveedor === ci_proveedor);
  };

  const getContactosProveedor = (ci_proveedor) => {
    return proveedoresContactos.filter(pc => pc.ci_proveedor === ci_proveedor);
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
    totalProductosAsociados: proveedoresProductos.length
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
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <Building size={32} style={{ color: "#7a3b06", marginTop: "4px" }} />
            <div>
              <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
                Gestión de Proveedores
              </h1>
              <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9, margin: 0 }}>
                Administra proveedores, productos asociados y contactos
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

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {[
          { 
            label: "Total Proveedores", 
            value: estadisticas.totalProveedores, 
            icon: Building, 
            color: "#e3f2fd", 
            iconColor: "#1976d2"
          },
          { 
            label: "Activos", 
            value: estadisticas.proveedoresActivos, 
            icon: Activity, 
            color: "#e8f5e8", 
            iconColor: "#28a745"
          },
          { 
            label: "Productos Asoc.", 
            value: estadisticas.totalProductosAsociados, 
            icon: Package, 
            color: "#fff3cd", 
            iconColor: "#856404"
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
                {stat.value}
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
              placeholder="Buscar por CI/NIT, empresa, contacto o descripción..."
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
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
          </select>

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
      </div>

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
          Nuevo Proveedor
        </button>
      </div>

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
          <Building size={20} style={{ color: "#7a3b06" }} />
          <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "18px", flex: 1 }}>
            Proveedores ({filteredProveedores.length})
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f5ee" }}>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>CI/NIT</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Empresa</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Contacto</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Descripción</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Productos</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Estado</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProveedores.map(proveedor => {
                const productosCount = getProductosProveedor(proveedor.ci_proveedor).length;
                const contactosCount = getContactosProveedor(proveedor.ci_proveedor).length;
                
                return (
                  <tr key={proveedor.ci_proveedor}>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                        {proveedor.ci_proveedor}
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div>
                        <div style={{ fontWeight: "500", color: "#7a3b06", fontSize: "16px" }}>
                          {proveedor.nombre_empresa}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                          {proveedor.fecha_registro ? new Date(proveedor.fecha_registro).toLocaleDateString('es-BO') : 'Sin fecha'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div>
                        <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                          {proveedor.contacto_principal}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                          {contactosCount} contacto{contactosCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {proveedor.ruta_entrega && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                            <Truck size={12} />
                            {proveedor.ruta_entrega}
                          </div>
                        )}
                        <div style={{ fontSize: "12px", color: "#6d4611", marginTop: "4px" }}>
                          {proveedor.descripcion}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px",
                          padding: "4px 8px",
                          backgroundColor: "#e8f5e8",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#28a745"
                        }}>
                          <Package size={12} />
                          {productosCount} producto{productosCount !== 1 ? 's' : ''}
                        </div>
                        {productosCount > 0 && (
                          <div style={{ fontSize: "11px", color: "#6d4611", opacity: 0.7 }}>
                            Ver productos
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", textAlign: "center" }}>
                      <div style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "4px",
                        padding: "4px 8px",
                        backgroundColor: proveedor.estado === 'activo' ? "#e8f5e8" : 
                                        proveedor.estado === 'inactivo' ? "#f8f9fa" : "#fee",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: proveedor.estado === 'activo' ? "#28a745" : 
                              proveedor.estado === 'inactivo' ? "#6c757d" : "#dc3545"
                      }}>
                        {proveedor.estado === 'activo' ? <CheckCircle size={12} /> : 
                         proveedor.estado === 'inactivo' ? <Clock size={12} /> : <XCircle size={12} />}
                        {proveedor.estado}
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", width: "180px" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => {
                            setForm({
                              ci_proveedor: proveedor.ci_proveedor || '',
                              nombre_empresa: proveedor.nombre_empresa || '',
                              contacto_principal: proveedor.contacto_principal || '',
                              descripcion: proveedor.descripcion || '',
                              ruta_entrega: proveedor.ruta_entrega || '',
                              estado: proveedor.estado || 'activo'
                            });
                            setEditingId(proveedor.ci_proveedor);
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
                          title="Editar proveedor"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowProductosModal(true);
                          }}
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
                          title="Gestionar productos"
                        >
                          <Package size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowContactosModal(true);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px 8px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            backgroundColor: "#6f42c1",
                            color: "white"
                          }}
                          title="Gestionar contactos"
                        >
                          <User size={14} />
                        </button>
                        <button
                          onClick={() => eliminarProveedor(proveedor.ci_proveedor)}
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
                          disabled={actionLoading === `delete-${proveedor.ci_proveedor}`}
                          title="Eliminar proveedor"
                        >
                          {actionLoading === `delete-${proveedor.ci_proveedor}` ? (
                            <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
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
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
              <Building size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <p>No se encontraron proveedores</p>
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
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ color: "#7a3b06", marginBottom: "20px", fontSize: "20px" }}>
              {editingId ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  CI/NIT del Proveedor *
                </label>
                <input
                  type="text"
                  value={form.ci_proveedor}
                  onChange={(e) => setForm({...form, ci_proveedor: e.target.value})}
                  required
                  minLength="2"
                  maxLength="20"
                  placeholder="Número de CI o NIT"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Nombre de Empresa *
                </label>
                <input
                  type="text"
                  value={form.nombre_empresa}
                  onChange={(e) => setForm({...form, nombre_empresa: e.target.value})}
                  required
                  minLength="2"
                  maxLength="100"
                  placeholder="Nombre legal de la empresa"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Contacto Principal *
                </label>
                <input
                  type="text"
                  value={form.contacto_principal}
                  onChange={(e) => setForm({...form, contacto_principal: e.target.value})}
                  required
                  minLength="2"
                  maxLength="100"
                  placeholder="Persona principal de contacto"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Ruta de Entrega
                </label>
                <input
                  type="text"
                  value={form.ruta_entrega}
                  onChange={(e) => setForm({...form, ruta_entrega: e.target.value})}
                  placeholder="Zona o ruta de entrega"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Descripción *
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  placeholder="Descripción del proveedor..."
                  rows="3"
                  maxLength="500"
                  required
                  minLength="10"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
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
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
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
                  {editingId ? "Actualizar" : "Crear Proveedor"}
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

      {showProductosModal && proveedorSeleccionado && (
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
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ color: "#7a3b06", marginBottom: "20px", fontSize: "20px" }}>
              Productos de {proveedorSeleccionado.nombre_empresa}
            </h3>
            
            <div style={{ background: "#f8f5ee", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Agregar Producto</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
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
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Precio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productoForm.precio_proveedor}
                    onChange={(e) => setProductoForm({...productoForm, precio_proveedor: e.target.value})}
                    placeholder="0.00"
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
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Moneda
                  </label>
                  <select
                    value={productoForm.moneda}
                    onChange={(e) => setProductoForm({...productoForm, moneda: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="BOB">BOB</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Unidad
                  </label>
                  <input
                    type="text"
                    value={productoForm.unidad_compra}
                    onChange={(e) => setProductoForm({...productoForm, unidad_compra: e.target.value})}
                    placeholder="kg, litros, cajas..."
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
              <button
                onClick={agregarProductoProveedor}
                disabled={!productoForm.id_producto || !productoForm.precio_proveedor || actionLoading === 'agregar-producto'}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  backgroundColor: "#28a745",
                  color: "white",
                  marginTop: "12px"
                }}
              >
                {actionLoading === 'agregar-producto' ? (
                  <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Plus size={14} />
                )}
                Agregar Producto
              </button>
            </div>

            <div>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Productos Asociados</h4>
              {getProductosProveedor(proveedorSeleccionado.ci_proveedor).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {getProductosProveedor(proveedorSeleccionado.ci_proveedor).map(pp => (
                    <div key={pp.id_proveedor_producto} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      backgroundColor: "white"
                    }}>
                      <div>
                        <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                          {getProductoNombre(pp.id_producto)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6d4611" }}>
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: pp.moneda 
                          }).format(pp.precio_proveedor)} • {pp.unidad_compra}
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarProductoProveedor(pp.id_proveedor_producto)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "6px",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: "#dc3545",
                          color: "white"
                        }}
                        disabled={actionLoading === `delete-producto-${pp.id_proveedor_producto}`}
                      >
                        {actionLoading === `delete-producto-${pp.id_proveedor_producto}` ? (
                          <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
                  <Package size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <p>No hay productos asociados</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button 
                onClick={() => setShowProductosModal(false)}
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
                  color: "white",
                  flex: 1
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactosModal && proveedorSeleccionado && (
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
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ color: "#7a3b06", marginBottom: "20px", fontSize: "20px" }}>
              Contactos de {proveedorSeleccionado.nombre_empresa}
            </h3>
            
            <div style={{ background: "#f8f5ee", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Agregar Contacto</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={contactoForm.nombre_contacto}
                    onChange={(e) => setContactoForm({...contactoForm, nombre_contacto: e.target.value})}
                    placeholder="Nombre completo"
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
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={contactoForm.cargo}
                    onChange={(e) => setContactoForm({...contactoForm, cargo: e.target.value})}
                    placeholder="Cargo o posición"
                    required
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={contactoForm.telefono}
                    onChange={(e) => setContactoForm({...contactoForm, telefono: e.target.value})}
                    placeholder="+591 XXX XXX"
                    required
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
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactoForm.email}
                    onChange={(e) => setContactoForm({...contactoForm, email: e.target.value})}
                    placeholder="contacto@empresa.com"
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <input
                  type="checkbox"
                  id="es_contacto_principal"
                  checked={contactoForm.es_contacto_principal}
                  onChange={(e) => setContactoForm({...contactoForm, es_contacto_principal: e.target.checked})}
                />
                <label htmlFor="es_contacto_principal" style={{ color: "#6d4611", fontSize: "12px" }}>
                  Contacto principal
                </label>
              </div>
              <button
                onClick={agregarContactoProveedor}
                disabled={!contactoForm.nombre_contacto || !contactoForm.cargo || !contactoForm.telefono || actionLoading === 'agregar-contacto'}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  backgroundColor: "#28a745",
                  color: "white"
                }}
              >
                {actionLoading === 'agregar-contacto' ? (
                  <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Plus size={14} />
                )}
                Agregar Contacto
              </button>
            </div>

            <div>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Contactos Asociados</h4>
              {getContactosProveedor(proveedorSeleccionado.ci_proveedor).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {getContactosProveedor(proveedorSeleccionado.ci_proveedor).map(contacto => (
                    <div key={contacto.id_contacto} style={{
                      padding: "12px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      backgroundColor: "white"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                            {contacto.nombre_contacto}
                            {contacto.es_contacto_principal && (
                              <span style={{ 
                                marginLeft: "8px",
                                padding: "2px 6px",
                                backgroundColor: "#e8f5e8",
                                color: "#28a745",
                                borderRadius: "12px",
                                fontSize: "10px",
                                fontWeight: "500"
                              }}>
                                Principal
                              </span>
                            )}
                          </div>
                          {contacto.cargo && (
                            <div style={{ fontSize: "12px", color: "#6d4611" }}>
                              {contacto.cargo}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => eliminarContactoProveedor(contacto.id_contacto)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "4px",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              backgroundColor: "#dc3545",
                              color: "white"
                            }}
                            disabled={actionLoading === `delete-contacto-${contacto.id_contacto}`}
                          >
                            {actionLoading === `delete-contacto-${contacto.id_contacto}` ? (
                              <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {contacto.telefono && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6d4611" }}>
                            <Phone size={12} />
                            {contacto.telefono}
                          </div>
                        )}
                        {contacto.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6d4611" }}>
                            <Mail size={12} />
                            {contacto.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
                  <User size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <p>No hay contactos asociados</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button 
                onClick={() => setShowContactosModal(false)}
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
                  color: "white",
                  flex: 1
                }}
              >
                Cerrar
              </button>
            </div>
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