// src/pages/Productos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Plus, Edit, Trash2, Search, Package, DollarSign, 
  Calendar, Filter, X, Save, Loader, AlertTriangle,
  CheckCircle, Eye, EyeOff
} from "lucide-react";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados para formularios
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    fecha_vencimiento: '',
    id_categoriaproducto: ''
  });

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Cargar datos
  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [productosData, categoriasData] = await Promise.all([
        supabase
          .from('productos')
          .select(`
            *,
            categoria_productos (nombre, tipo)
          `)
          .order('id_producto'),
        supabase
          .from('categoria_productos')
          .select('*')
          .order('nombre')
      ]);

      if (productosData.error) throw productosData.error;
      if (categoriasData.error) throw categoriasData.error;

      setProductos(productosData.data || []);
      setCategorias(categoriasData.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validateForm = (data) => {
    if (!data.nombre.trim()) throw new Error("El nombre del producto es requerido");
    if (data.nombre.length > 100) throw new Error("El nombre no puede exceder 100 caracteres");
    
    if (!data.precio || parseFloat(data.precio) <= 0) throw new Error("El precio debe ser mayor a 0");
    if (parseFloat(data.precio) > 999999.99) throw new Error("El precio es demasiado alto");
    
    if (!data.id_categoriaproducto) throw new Error("Debe seleccionar una categoría");
    
    if (data.fecha_vencimiento) {
      const fechaVencimiento = new Date(data.fecha_vencimiento);
      const hoy = new Date();
      if (fechaVencimiento < hoy) throw new Error("La fecha de vencimiento no puede ser anterior a hoy");
    }
  };

  // Funciones CRUD
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      validateForm(form);
      
      const productoData = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: parseFloat(form.precio),
        fecha_vencimiento: form.fecha_vencimiento || null,
        id_categoriaproducto: parseInt(form.id_categoriaproducto)
      };

      const { error } = await supabase
        .from('productos')
        .insert([productoData]);

      if (error) {
        if (error.code === '23505') throw new Error("Ya existe un producto con ese nombre");
        throw error;
      }

      showMessage("Producto creado exitosamente", "success");
      resetForm();
      await loadData();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      validateForm(updates);
      
      const productoData = {
        nombre: updates.nombre.trim(),
        descripcion: updates.descripcion.trim() || null,
        precio: parseFloat(updates.precio),
        fecha_vencimiento: updates.fecha_vencimiento || null,
        id_categoriaproducto: parseInt(updates.id_categoriaproducto)
      };

      const { error } = await supabase
        .from('productos')
        .update(productoData)
        .eq('id_producto', id);

      if (error) {
        if (error.code === '23505') throw new Error("Ya existe un producto con ese nombre");
        throw error;
      }

      showMessage("Producto actualizado exitosamente", "success");
      resetForm();
      await loadData();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleDelete = async (id) => {
    // Verificar si el producto está en uso en inventario o pedidos
    const [inventarioData, pedidosData] = await Promise.all([
      supabase.from('inventario').select('id_inventario').eq('id_producto', id),
      supabase.from('pedido_producto').select('id_pedido_producto').eq('id_producto', id)
    ]);

    const totalUso = (inventarioData.data?.length || 0) + (pedidosData.data?.length || 0);
    
    if (totalUso > 0) {
      showMessage(`No se puede eliminar. El producto está en uso en ${totalUso} registro(s)`);
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        const { error } = await supabase.from('productos').delete().eq('id_producto', id);
        if (error) throw error;
        showMessage("Producto eliminado exitosamente", "success");
        await loadData();
      } catch (error) {
        showMessage(`Error eliminando producto: ${error.message}`);
      }
    }
  };

  // Filtros
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategoria = !filterCategoria || producto.id_categoriaproducto === parseInt(filterCategoria);
    
    return matchesSearch && matchesCategoria;
  });

  // Reset form
  const resetForm = () => {
    setForm({
      nombre: '',
      descripcion: '',
      precio: '',
      fecha_vencimiento: '',
      id_categoriaproducto: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Formateadores
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return null;
    const expiry = new Date(dateString);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (dateString) => {
    const days = getDaysUntilExpiry(dateString);
    if (days === null) return null;
    
    if (days < 0) return { text: 'Vencido', style: 'badge-danger' };
    if (days <= 7) return { text: `Vence en ${days} días`, style: 'badge-warning' };
    if (days <= 30) return { text: `Vence en ${days} días`, style: 'badge-info' };
    return null;
  };

  // Estilos
  const styles = {
    container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
    pageHeader: { marginBottom: "30px" },
    pageHeaderH1: { fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" },
    pageHeaderP: { color: "#6d4611", fontSize: "14px", opacity: 0.9 },
    loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#7a3b06" },
    alert: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" },
    alertError: { backgroundColor: "#fee", border: "1px solid #f5c6cb", color: "#721c24" },
    alertSuccess: { backgroundColor: "#f0fff4", border: "1px solid #c3e6cb", color: "#155724" },
    alertClose: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", opacity: 0.7 },
    searchBar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
    searchBox: { position: "relative", flex: "1", minWidth: "300px" },
    searchInput: { width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #e9d8b5", borderRadius: "8px", fontSize: "14px" },
    filterButton: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "white", border: "1px solid #e9d8b5", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
    filtersPanel: { background: "white", padding: "16px", border: "1px solid #e9d8b5", borderRadius: "8px", marginBottom: "20px" },
    actionButtons: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
    btn: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "all 0.2s" },
    btnPrimary: { backgroundColor: "#7a3b06", color: "white" },
    btnSuccess: { backgroundColor: "#28a745", color: "white" },
    btnCancel: { backgroundColor: "#6c757d", color: "white" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
    modal: { background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e9d8b5", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto" },
    formGroup: { marginBottom: "16px" },
    formLabel: { display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500" },
    formInput: { width: "100%", padding: "10px", border: "1px solid #e9d8b5", borderRadius: "6px", fontSize: "14px" },
    formSelect: { width: "100%", padding: "10px", border: "1px solid #e9d8b5", borderRadius: "6px", fontSize: "14px", background: "white" },
    formActions: { display: "flex", gap: "12px", marginTop: "24px" },
    tableCard: { background: "white", borderRadius: "12px", border: "1px solid #e9d8b5", overflow: "hidden" },
    tableHeader: { padding: "20px", borderBottom: "1px solid #e9d8b5", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8f5ee" },
    tableContainer: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
    th: { padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", backgroundColor: "#f8f5ee" },
    td: { padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" },
    idCell: { fontWeight: "600", color: "#7a3b06" },
    nameCell: { fontWeight: "500" },
    descCell: { maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    priceCell: { textAlign: "right", fontWeight: "600" },
    actionsCell: { width: "100px" },
    actionButtonsSmall: { display: "flex", gap: "6px", justifyContent: "center" },
    btnEdit: { display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 8px", border: "none", borderRadius: "4px", cursor: "pointer", transition: "all 0.2s", backgroundColor: "#ffc107", color: "#7a3b06" },
    btnDelete: { display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 8px", border: "none", borderRadius: "4px", cursor: "pointer", transition: "all 0.2s", backgroundColor: "#dc3545", color: "white" },
    badge: { display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" },
    badgeSuccess: { backgroundColor: "#d4edda", color: "#155724" },
    badgeWarning: { backgroundColor: "#fff3cd", color: "#856404" },
    badgeDanger: { backgroundColor: "#f8d7da", color: "#721c24" },
    badgeInfo: { backgroundColor: "#d1ecf1", color: "#0c5460" },
    emptyState: { padding: "40px 20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.pageHeader}>
        <h1 style={styles.pageHeaderH1}>Gestión de Productos</h1>
        <p style={styles.pageHeaderP}>Administra los productos del restaurante</p>
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

      {/* Barra de búsqueda y filtros */}
      <div style={styles.searchBar}>
        <div style={styles.searchBox}>
          <Search size={18} style={{position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6d4611"}} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Filter size={16} />
          Filtros
          {filterCategoria && <span style={{...styles.badge, ...styles.badgeInfo}}>1</span>}
        </button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div style={styles.filtersPanel}>
          <div style={{display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap"}}>
            <div style={{flex: "1", minWidth: "200px"}}>
              <label style={styles.formLabel}>Categoría</label>
              <select 
                value={filterCategoria} 
                onChange={(e) => setFilterCategoria(e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoriaproducto} value={cat.id_categoriaproducto}>
                    {cat.nombre} ({cat.tipo})
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => { setFilterCategoria(""); setSearchTerm(""); }}
              style={{...styles.btn, ...styles.btnCancel, alignSelf: "flex-end"}}
            >
              <X size={16} />
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div style={styles.actionButtons}>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          style={{...styles.btn, ...styles.btnPrimary}}
        >
          <Plus size={16} />
          Nuevo Producto
        </button>
        
        <div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", color: "#6d4611", fontSize: "14px"}}>
          <Package size={16} />
          {filteredProductos.length} producto(s) encontrado(s)
        </div>
      </div>

      {/* Formulario modal */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{color: "#7a3b06", marginBottom: "20px", fontSize: "20px"}}>
              {editingId ? "Editar Producto" : "Nuevo Producto"}
            </h3>
            
            <form onSubmit={editingId ? 
              (e) => { e.preventDefault(); handleUpdate(editingId, form); } : 
              handleCreate
            }>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nombre del Producto *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  required
                  maxLength={100}
                  placeholder="Ej: Lomo Saltado"
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  placeholder="Descripción del producto..."
                  rows="3"
                  maxLength={200}
                  style={styles.formInput}
                />
              </div>

              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Precio (BOB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999.99"
                    value={form.precio}
                    onChange={(e) => setForm({...form, precio: e.target.value})}
                    required
                    placeholder="0.00"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={form.fecha_vencimiento}
                    onChange={(e) => setForm({...form, fecha_vencimiento: e.target.value})}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Categoría *</label>
                <select
                  value={form.id_categoriaproducto}
                  onChange={(e) => setForm({...form, id_categoriaproducto: e.target.value})}
                  required
                  style={styles.formSelect}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoriaproducto} value={cat.id_categoriaproducto}>
                      {cat.nombre} ({cat.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={{...styles.btn, ...styles.btnSuccess}}>
                  <Save size={16} />
                  {editingId ? "Actualizar" : "Guardar"}
                </button>
                <button type="button" onClick={resetForm} style={{...styles.btn, ...styles.btnCancel}}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de productos */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <Package size={20} />
          <h2 style={{color: "#7a3b06", margin: 0, fontSize: "18px"}}>
            Productos ({filteredProductos.length})
          </h2>
        </div>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Vencimiento</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.map(producto => {
                const expiryBadge = getExpiryBadge(producto.fecha_vencimiento);
                
                return (
                  <tr key={producto.id_producto}>
                    <td style={{...styles.td, ...styles.idCell}}>{producto.id_producto}</td>
                    <td style={{...styles.td, ...styles.nameCell}}>{producto.nombre}</td>
                    <td style={{...styles.td, ...styles.descCell}} title={producto.descripcion}>
                      {producto.descripcion || '-'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(producto.categoria_productos?.tipo === 'comida' ? styles.badgeSuccess : styles.badgeInfo)
                      }}>
                        {producto.categoria_productos?.nombre}
                      </span>
                    </td>
                    <td style={{...styles.td, ...styles.priceCell}}>
                      {formatCurrency(producto.precio)}
                    </td>
                    <td style={styles.td}>
                      <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                        <span>{formatDate(producto.fecha_vencimiento)}</span>
                        {expiryBadge && (
                          <span style={{...styles.badge, ...styles[expiryBadge.style]}}>
                            {expiryBadge.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{...styles.td, ...styles.actionsCell}}>
                      <div style={styles.actionButtonsSmall}>
                        <button
                          onClick={() => {
                            setForm({
                              nombre: producto.nombre,
                              descripcion: producto.descripcion || '',
                              precio: producto.precio.toString(),
                              fecha_vencimiento: producto.fecha_vencimiento || '',
                              id_categoriaproducto: producto.id_categoriaproducto.toString()
                            });
                            setEditingId(producto.id_producto);
                            setShowForm(true);
                          }}
                          style={styles.btnEdit}
                          title="Editar producto"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id_producto)}
                          style={styles.btnDelete}
                          title="Eliminar producto"
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
          
          {filteredProductos.length === 0 && (
            <div style={styles.emptyState}>
              <Package size={32} style={{opacity: 0.5, marginBottom: "16px"}} />
              <p>No se encontraron productos</p>
              {searchTerm || filterCategoria ? (
                <p style={{fontSize: "14px", marginTop: "8px"}}>
                  Intenta ajustar los filtros de búsqueda
                </p>
              ) : (
                <button 
                  onClick={() => { resetForm(); setShowForm(true); }}
                  style={{...styles.btn, ...styles.btnPrimary, marginTop: "16px"}}
                >
                  <Plus size={16} />
                  Crear primer producto
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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
        
        .btn-edit:hover, .btn-delete:hover {
          opacity: 0.8;
        }
        
        @media (max-width: 768px) {
          .container { padding: 16px; }
          .search-bar { flex-direction: column; }
          .search-box { min-width: 100%; }
          .action-buttons { flex-direction: column; }
          .btn { justify-content: center; }
          .form-actions { flex-direction: column; }
          .modal { margin: 20px; }
        }
      `}</style>
    </div>
  );
}