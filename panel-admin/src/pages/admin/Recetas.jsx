// src/pages/Recetas.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../bd/supabaseClient";
import { Edit, Trash2, Plus, Book } from "lucide-react";

export default function Recetas() {
  const [recetas, setRecetas] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    detalles: '',
    cantidad: '',
    id_ingrediente: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [recetasRes, ingredientesRes] = await Promise.all([
        supabase.from('recetas').select('*'),
        supabase.from('ingredientes').select('*')
      ]);
      
      if (recetasRes.error) throw recetasRes.error;
      if (ingredientesRes.error) throw ingredientesRes.error;
      
      setRecetas(recetasRes.data || []);
      setIngredientes(ingredientesRes.data || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar datos: ' + error.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('recetas')
        .insert([{
          ...form,
          cantidad: parseInt(form.cantidad)
        }]);
      
      if (error) throw error;
      setForm({ nombre: '', detalles: '', cantidad: '', id_ingrediente: '' });
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear receta: ' + error.message);
    }
  };

  const eliminarReceta = async (id) => {
    if (window.confirm('¿Eliminar receta?')) {
      try {
        const { error } = await supabase.from('recetas').delete().eq('id_receta', id);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar receta: ' + error.message);
      }
    }
  };

  const getIngredienteNombre = (id_ingrediente) => {
    const ingrediente = ingredientes.find(i => i.id_ingrediente === id_ingrediente);
    return ingrediente ? ingrediente.nombre : 'N/A';
  };

  if (loading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Recetas
      </h1>

      <button
        onClick={() => setShowForm(true)}
        style={{
          padding: "12px 20px",
          backgroundColor: "#7a3b06",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <Plus size={16} />
        Nueva Receta
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Nueva Receta</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Nombre de la Receta
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({...form, nombre: e.target.value})}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px"
                }}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Detalles
              </label>
              <textarea
                value={form.detalles}
                onChange={(e) => setForm({...form, detalles: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  minHeight: "60px"
                }}
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Cantidad
                </label>
                <input
                  type="number"
                  value={form.cantidad}
                  onChange={(e) => setForm({...form, cantidad: e.target.value})}
                  required
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Ingrediente Principal
                </label>
                <select
                  value={form.id_ingrediente}
                  onChange={(e) => setForm({...form, id_ingrediente: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
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
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Guardar Receta
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ nombre: '', detalles: '', cantidad: '', id_ingrediente: '' });
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e9d8b5", padding: "20px" }}>
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Recetas</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Nombre</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Detalles</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Cantidad</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Ingrediente</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recetas.map(receta => (
              <tr key={receta.id_receta}>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{receta.id_receta}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{receta.nombre}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{receta.detalles}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{receta.cantidad}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {getIngredienteNombre(receta.id_ingrediente)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => {
                        setForm({
                          nombre: receta.nombre,
                          detalles: receta.detalles,
                          cantidad: receta.cantidad,
                          id_ingrediente: receta.id_ingrediente
                        });
                        setShowForm(true);
                      }}
                      style={{ 
                        padding: "5px 10px", 
                        backgroundColor: "#ffc107", 
                        color: "#7a3b06", 
                        border: "none", 
                        borderRadius: "4px" 
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => eliminarReceta(receta.id_receta)}
                      style={{ 
                        padding: "5px 10px", 
                        backgroundColor: "#dc3545", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "4px" 
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}