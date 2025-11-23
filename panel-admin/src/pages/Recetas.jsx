// src/pages/Recetas.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Book, 
  Search,
  Filter,
  ChefHat,
  Scale,
  List,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Save,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Users
} from "lucide-react";

export default function Recetas() {
  const [recetas, setRecetas] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [productoIngredientes, setProductoIngredientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [showIngredientesModal, setShowIngredientesModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroIngrediente, setFiltroIngrediente] = useState("todos");
  const [showFiltros, setShowFiltros] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    detalles: '',
    cantidad: '',
    id_ingrediente: '',
    tiempo_preparacion: '',
    porciones: '',
    dificultad: 'media',
    categoria: ''
  });

  const [ingredienteForm, setIngredienteForm] = useState({
    id_ingrediente: '',
    cantidad: '',
    unidad: 'gr'
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
      const [recetasRes, ingredientesRes, productoIngredientesRes, productosRes] = await Promise.all([
        supabase.from('recetas').select('*').order('id_receta', { ascending: false }),
        supabase.from('ingredientes').select('*').order('nombre'),
        supabase.from('producto_ingrediente').select('*'),
        supabase.from('productos').select('*')
      ]);
      
      const errors = [
        recetasRes.error, 
        ingredientesRes.error, 
        productoIngredientesRes.error,
        productosRes.error
      ].filter(error => error);

      if (errors.length > 0) {
        throw new Error(`Errores al cargar: ${errors.map(e => e.message).join(', ')}`);
      }
      
      setRecetas(recetasRes.data || []);
      setIngredientes(ingredientesRes.data || []);
      setProductoIngredientes(productoIngredientesRes.data || []);
      setProductos(productosRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // VALIDACIONES
  const validateReceta = (recetaData) => {
    const errors = [];

    if (!recetaData.nombre || recetaData.nombre.trim().length < 2) {
      errors.push("El nombre de la receta debe tener al menos 2 caracteres");
    }

    if (!recetaData.cantidad || parseInt(recetaData.cantidad) <= 0) {
      errors.push("La cantidad debe ser mayor a 0");
    }

    if (!recetaData.id_ingrediente) {
      errors.push("Debe seleccionar un ingrediente principal");
    }

    if (recetaData.tiempo_preparacion && parseInt(recetaData.tiempo_preparacion) < 1) {
      errors.push("El tiempo de preparación debe ser mayor a 0");
    }

    if (recetaData.porciones && parseInt(recetaData.porciones) < 1) {
      errors.push("Las porciones deben ser mayor a 0");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('guardar');
    
    try {
      const recetaData = {
        nombre: form.nombre.trim(),
        detalles: form.detalles.trim() || null,
        cantidad: parseInt(form.cantidad),
        id_ingrediente: parseInt(form.id_ingrediente),
        tiempo_preparacion: form.tiempo_preparacion ? parseInt(form.tiempo_preparacion) : null,
        porciones: form.porciones ? parseInt(form.porciones) : null,
        dificultad: form.dificultad,
        categoria: form.categoria.trim() || null
      };

      validateReceta(recetaData);

      let result;
      if (editingId) {
        result = await supabase
          .from('recetas')
          .update(recetaData)
          .eq('id_receta', editingId);
      } else {
        result = await supabase
          .from('recetas')
          .insert([recetaData]);
      }
      
      if (result.error) throw result.error;

      showMessage(`Receta ${editingId ? 'actualizada' : 'creada'} exitosamente`, "success");
      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const agregarIngredienteReceta = async () => {
    if (!recetaSeleccionada) return;
    
    setActionLoading('agregar-ingrediente');
    
    try {
      const ingredienteData = {
        id_producto: recetaSeleccionada.id_receta, // Usamos id_receta como referencia
        id_ingrediente: parseInt(ingredienteForm.id_ingrediente),
        cantidad: parseFloat(ingredienteForm.cantidad),
        unidad: ingredienteForm.unidad
      };

      const { error } = await supabase
        .from('producto_ingrediente')
        .insert([ingredienteData]);

      if (error) throw error;

      showMessage("Ingrediente agregado a la receta exitosamente", "success");
      setIngredienteForm({
        id_ingrediente: '',
        cantidad: '',
        unidad: 'gr'
      });
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarReceta = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta receta? Esta acción no se puede deshacer.')) {
      return;
    }

    setActionLoading(`delete-${id}`);
    
    try {
      // Primero eliminar ingredientes asociados
      const { error: errorIngredientes } = await supabase
        .from('producto_ingrediente')
        .delete()
        .eq('id_producto', id);

      if (errorIngredientes) console.error("Error eliminando ingredientes:", errorIngredientes);

      // Luego eliminar la receta
      const { error } = await supabase
        .from('recetas')
        .delete()
        .eq('id_receta', id);

      if (error) throw error;
      
      showMessage("Receta eliminada exitosamente", "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al eliminar receta: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarIngredienteReceta = async (idProductoIngrediente) => {
    if (!window.confirm('¿Eliminar este ingrediente de la receta?')) {
      return;
    }

    setActionLoading(`delete-ingrediente-${idProductoIngrediente}`);
    
    try {
      const { error } = await supabase
        .from('producto_ingrediente')
        .delete()
        .eq('id_producto_ingrediente', idProductoIngrediente);

      if (error) throw error;
      
      showMessage("Ingrediente eliminado de la receta", "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error al eliminar ingrediente: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setForm({ 
      nombre: '',
      detalles: '',
      cantidad: '',
      id_ingrediente: '',
      tiempo_preparacion: '',
      porciones: '',
      dificultad: 'media',
      categoria: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const resetFiltros = () => {
    setSearchTerm("");
    setFiltroIngrediente("todos");
  };

  // CÁLCULOS Y FILTROS
  const getIngredienteNombre = (id_ingrediente) => {
    const ingrediente = ingredientes.find(i => i.id_ingrediente === id_ingrediente);
    return ingrediente ? ingrediente.nombre : 'No asignado';
  };

  const getIngredientesReceta = (id_receta) => {
    return productoIngredientes.filter(pi => pi.id_producto === id_receta);
  };

  const getTotalIngredientes = (id_receta) => {
    return getIngredientesReceta(id_receta).length;
  };

  const getDificultadColor = (dificultad) => {
    const colores = {
      facil: '#28a745',
      media: '#ffc107',
      dificil: '#dc3545'
    };
    return colores[dificultad] || '#6c757d';
  };

  // FILTRADO MEJORADO
  const filteredRecetas = recetas.filter(receta => {
    const matchesSearch = 
      receta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receta.detalles?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receta.categoria?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIngrediente = filtroIngrediente === "todos" || 
      receta.id_ingrediente.toString() === filtroIngrediente;

    return matchesSearch && matchesIngrediente;
  });

  // ESTADÍSTICAS
  const estadisticas = {
    totalRecetas: recetas.length,
    recetasFaciles: recetas.filter(r => r.dificultad === 'facil').length,
    recetasConTiempo: recetas.filter(r => r.tiempo_preparacion).length,
    totalIngredientesUsados: [...new Set(recetas.map(r => r.id_ingrediente))].length
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
        <p>Cargando recetas...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <Book size={32} style={{ color: "#7a3b06", marginTop: "4px" }} />
            <div>
              <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
                Gestión de Recetas
              </h1>
              <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9, margin: 0 }}>
                Administra las recetas del restaurante y sus ingredientes
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

      {/* Estadísticas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {[
          { 
            label: "Total Recetas", 
            value: estadisticas.totalRecetas, 
            icon: Book, 
            color: "#e3f2fd", 
            iconColor: "#1976d2"
          },
          { 
            label: "Recetas Fáciles", 
            value: estadisticas.recetasFaciles, 
            icon: ChefHat, 
            color: "#e8f5e8", 
            iconColor: "#28a745"
          },
          { 
            label: "Con Tiempo Est.", 
            value: estadisticas.recetasConTiempo, 
            icon: Clock, 
            color: "#f3e5f5", 
            iconColor: "#7b1fa2"
          },
          { 
            label: "Ingredientes Únicos", 
            value: estadisticas.totalIngredientesUsados, 
            icon: Scale, 
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
              placeholder="Buscar por nombre, detalles o categoría..."
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
            value={filtroIngrediente}
            onChange={(e) => setFiltroIngrediente(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #e9d8b5",
              borderRadius: "8px",
              fontSize: "14px",
              minWidth: "200px"
            }}
          >
            <option value="todos">Todos los ingredientes</option>
            {ingredientes.map(ingrediente => (
              <option key={ingrediente.id_ingrediente} value={ingrediente.id_ingrediente}>
                {ingrediente.nombre}
              </option>
            ))}
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
          Nueva Receta
        </button>
      </div>

      {/* Tabla de recetas */}
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
          <Book size={20} style={{ color: "#7a3b06" }} />
          <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "18px", flex: 1 }}>
            Recetas ({filteredRecetas.length})
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f5ee" }}>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Nombre</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Detalles</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "left" }}>Ingrediente Principal</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Ingredientes</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Dificultad</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Tiempo</th>
                <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecetas.map(receta => {
                const totalIngredientes = getTotalIngredientes(receta.id_receta);
                
                return (
                  <tr key={receta.id_receta}>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div>
                        <div style={{ fontWeight: "500", color: "#7a3b06", fontSize: "16px" }}>
                          {receta.nombre}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                          ID: #{receta.id_receta}
                          {receta.categoria && ` • ${receta.categoria}`}
                        </div>
                        {receta.porciones && (
                          <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8, display: "flex", alignItems: "center", gap: "4px" }}>
                            <Users size={12} />
                            {receta.porciones} porciones
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", maxWidth: "200px" }}>
                      {receta.detalles ? (
                        <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                          {receta.detalles.length > 100 ? 
                            `${receta.detalles.substring(0, 100)}...` : receta.detalles}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#6d4611", opacity: 0.7, fontStyle: "italic" }}>
                          Sin detalles
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div style={{ fontWeight: "500", color: "#7a3b06" }}>
                        {getIngredienteNombre(receta.id_ingrediente)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                        Cantidad: {receta.cantidad}
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", textAlign: "center" }}>
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
                        <List size={12} />
                        {totalIngredientes} ingrediente{totalIngredientes !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", textAlign: "center" }}>
                      <div style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "4px",
                        padding: "4px 8px",
                        backgroundColor: `${getDificultadColor(receta.dificultad)}20`,
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: getDificultadColor(receta.dificultad)
                      }}>
                        <ChefHat size={12} />
                        {receta.dificultad}
                      </div>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", textAlign: "center" }}>
                      {receta.tiempo_preparacion ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                          <Clock size={12} />
                          {receta.tiempo_preparacion} min
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#6d4611", opacity: 0.7, fontStyle: "italic" }}>
                          No especificado
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", width: "150px" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => {
                            setForm({
                              nombre: receta.nombre || '',
                              detalles: receta.detalles || '',
                              cantidad: receta.cantidad || '',
                              id_ingrediente: receta.id_ingrediente?.toString() || '',
                              tiempo_preparacion: receta.tiempo_preparacion || '',
                              porciones: receta.porciones || '',
                              dificultad: receta.dificultad || 'media',
                              categoria: receta.categoria || ''
                            });
                            setEditingId(receta.id_receta);
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
                          title="Editar receta"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setRecetaSeleccionada(receta);
                            setShowIngredientesModal(true);
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
                          title="Gestionar ingredientes"
                        >
                          <List size={14} />
                        </button>
                        <button
                          onClick={() => eliminarReceta(receta.id_receta)}
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
                          disabled={actionLoading === `delete-${receta.id_receta}`}
                          title="Eliminar receta"
                        >
                          {actionLoading === `delete-${receta.id_receta}` ? (
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
          {filteredRecetas.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
              <Book size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <p>No se encontraron recetas</p>
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

      {/* Modal de formulario principal */}
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
              {editingId ? "Editar Receta" : "Nueva Receta"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#6d4611",
                  fontWeight: "500"
                }}>
                  Nombre de la Receta *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  required
                  minLength="2"
                  maxLength="100"
                  placeholder="Nombre descriptivo de la receta"
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
                  Detalles
                </label>
                <textarea
                  value={form.detalles}
                  onChange={(e) => setForm({...form, detalles: e.target.value})}
                  placeholder="Instrucciones, notas o detalles de preparación..."
                  rows="3"
                  maxLength="500"
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
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={form.cantidad}
                    onChange={(e) => setForm({...form, cantidad: e.target.value})}
                    required
                    min="1"
                    placeholder="Cantidad base"
                    style={{
                      width: "100%",
                      padding: "10px",
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
                    fontWeight: "500"
                  }}>
                    Ingrediente Principal *
                  </label>
                  <select
                    value={form.id_ingrediente}
                    onChange={(e) => setForm({...form, id_ingrediente: e.target.value})}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="">Seleccionar ingrediente</option>
                    {ingredientes.map(ingrediente => (
                      <option key={ingrediente.id_ingrediente} value={ingrediente.id_ingrediente}>
                        {ingrediente.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#6d4611",
                    fontWeight: "500",
                    fontSize: "12px"
                  }}>
                    Tiempo Preparación (min)
                  </label>
                  <input
                    type="number"
                    value={form.tiempo_preparacion}
                    onChange={(e) => setForm({...form, tiempo_preparacion: e.target.value})}
                    min="1"
                    placeholder="30"
                    style={{
                      width: "100%",
                      padding: "10px",
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
                    Porciones
                  </label>
                  <input
                    type="number"
                    value={form.porciones}
                    onChange={(e) => setForm({...form, porciones: e.target.value})}
                    min="1"
                    placeholder="4"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#6d4611",
                    fontWeight: "500"
                  }}>
                    Dificultad
                  </label>
                  <select
                    value={form.dificultad}
                    onChange={(e) => setForm({...form, dificultad: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="facil">Fácil</option>
                    <option value="media">Media</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#6d4611",
                    fontWeight: "500"
                  }}>
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => setForm({...form, categoria: e.target.value})}
                    placeholder="Ej: Postres, Platos principales..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
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
                  {editingId ? "Actualizar" : "Crear Receta"}
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

      {/* Modal para gestionar ingredientes de la receta */}
      {showIngredientesModal && recetaSeleccionada && (
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
              Ingredientes de "{recetaSeleccionada.nombre}"
            </h3>
            
            {/* Formulario para agregar ingrediente */}
            <div style={{ background: "#f8f5ee", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Agregar Ingrediente</h4>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500", fontSize: "12px" }}>
                    Ingrediente
                  </label>
                  <select
                    value={ingredienteForm.id_ingrediente}
                    onChange={(e) => setIngredienteForm({...ingredienteForm, id_ingrediente: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="">Seleccionar ingrediente</option>
                    {ingredientes.map(ingrediente => (
                      <option key={ingrediente.id_ingrediente} value={ingrediente.id_ingrediente}>
                        {ingrediente.nombre}
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
                    step="0.01"
                    value={ingredienteForm.cantidad}
                    onChange={(e) => setIngredienteForm({...ingredienteForm, cantidad: e.target.value})}
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
                    Unidad
                  </label>
                  <select
                    value={ingredienteForm.unidad}
                    onChange={(e) => setIngredienteForm({...ingredienteForm, unidad: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="gr">gr</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="lt">lt</option>
                    <option value="unidad">unidad</option>
                    <option value="cucharada">cucharada</option>
                    <option value="cucharadita">cucharadita</option>
                  </select>
                </div>
              </div>
              <button
                onClick={agregarIngredienteReceta}
                disabled={!ingredienteForm.id_ingrediente || !ingredienteForm.cantidad || actionLoading === 'agregar-ingrediente'}
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
                {actionLoading === 'agregar-ingrediente' ? (
                  <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Plus size={14} />
                )}
                Agregar Ingrediente
              </button>
            </div>

            {/* Lista de ingredientes existentes */}
            <div>
              <h4 style={{ color: "#7a3b06", marginBottom: "16px" }}>Ingredientes Asociados</h4>
              {getIngredientesReceta(recetaSeleccionada.id_receta).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {getIngredientesReceta(recetaSeleccionada.id_receta).map(pi => (
                    <div key={pi.id_producto_ingrediente} style={{
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
                          {getIngredienteNombre(pi.id_ingrediente)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6d4611" }}>
                          {pi.cantidad} {pi.unidad}
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarIngredienteReceta(pi.id_producto_ingrediente)}
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
                        disabled={actionLoading === `delete-ingrediente-${pi.id_producto_ingrediente}`}
                      >
                        {actionLoading === `delete-ingrediente-${pi.id_producto_ingrediente}` ? (
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
                  <Scale size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <p>No hay ingredientes asociados</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button 
                onClick={() => setShowIngredientesModal(false)}
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