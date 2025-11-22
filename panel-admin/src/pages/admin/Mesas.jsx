// src/pages/Mesas.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../bd/supabaseClient";
import { Edit, Trash2, Plus, Table } from "lucide-react";

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nromesa: '',
    salon: '',
    capacidad: '',
    estado: 'libre'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data, error } = await supabase.from('mesas').select('*');
      if (error) throw error;
      setMesas(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('mesas')
        .insert([{
          ...form,
          nromesa: parseInt(form.nromesa),
          salon: parseInt(form.salon),
          capacidad: parseInt(form.capacidad)
        }]);
      
      if (error) throw error;
      setForm({ nromesa: '', salon: '', capacidad: '', estado: 'libre' });
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarMesa = async (nromesa) => {
    if (window.confirm('¿Eliminar mesa?')) {
      await supabase.from('mesas').delete().eq('nromesa', nromesa);
      cargarDatos();
    }
  };

  const actualizarMesa = async (nromesa, updates) => {
    try {
      const { error } = await supabase
        .from('mesas')
        .update(updates)
        .eq('nromesa', nromesa);
      
      if (error) throw error;
      cargarDatos();
    } catch (error) {
      console.error('Error actualizando:', error);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Mesas
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
        Nueva Mesa
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Nueva Mesa</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Número de Mesa
                </label>
                <input
                  type="number"
                  value={form.nromesa}
                  onChange={(e) => setForm({...form, nromesa: e.target.value})}
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
                  Salón
                </label>
                <input
                  type="number"
                  value={form.salon}
                  onChange={(e) => setForm({...form, salon: e.target.value})}
                  required
                  min="1"
                  max="4"
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
                  Capacidad
                </label>
                <input
                  type="number"
                  value={form.capacidad}
                  onChange={(e) => setForm({...form, capacidad: e.target.value})}
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
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Estado
              </label>
              <select
                value={form.estado}
                onChange={(e) => setForm({...form, estado: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px"
                }}
              >
                <option value="libre">Libre</option>
                <option value="ocupada">Ocupada</option>
                <option value="reservada">Reservada</option>
              </select>
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
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ nromesa: '', salon: '', capacidad: '', estado: 'libre' });
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Mesas</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Nro Mesa</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Salón</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Capacidad</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Estado</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mesas.map(mesa => (
              <tr key={mesa.nromesa}>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{mesa.nromesa}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{mesa.salon}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{mesa.capacidad}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  <select
                    value={mesa.estado}
                    onChange={(e) => actualizarMesa(mesa.nromesa, { estado: e.target.value })}
                    style={{
                      padding: "5px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "4px",
                      backgroundColor: mesa.estado === 'ocupada' ? '#fff5f5' : 
                                     mesa.estado === 'reservada' ? '#f0f8ff' : '#f5fff5'
                    }}
                  >
                    <option value="libre">Libre</option>
                    <option value="ocupada">Ocupada</option>
                    <option value="reservada">Reservada</option>
                  </select>
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => {
                        setForm({
                          nromesa: mesa.nromesa,
                          salon: mesa.salon,
                          capacidad: mesa.capacidad,
                          estado: mesa.estado
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
                      onClick={() => eliminarMesa(mesa.nromesa)}
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