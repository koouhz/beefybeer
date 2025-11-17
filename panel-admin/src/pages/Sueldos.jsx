// src/pages/Sueldos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Sueldos() {
  const [sueldos, setSueldos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ monto: '', descripcion: '', id_cargo: '' });
  const [editingId, setEditingId] = useState(null); // ← para saber si estamos editando

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [sueldosRes, cargosRes] = await Promise.all([
        supabase.from('sueldos').select('*'),
        supabase.from('cargos').select('*')
      ]);
      
      setSueldos(sueldosRes.data || []);
      setCargos(cargosRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Editar sueldo
        const { error } = await supabase
          .from('sueldos')
          .update({ 
            ...form, 
            monto: parseFloat(form.monto) 
          })
          .eq('id_sueldo', editingId);
        if (error) throw error;
      } else {
        // Nuevo sueldo
        const { error } = await supabase
          .from('sueldos')
          .insert([{ 
            ...form, 
            monto: parseFloat(form.monto) 
          }]);
        if (error) throw error;
      }

      // Reset
      setForm({ monto: '', descripcion: '', id_cargo: '' });
      setEditingId(null);
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const editarSueldo = (sueldo) => {
    setForm({
      monto: sueldo.monto,
      descripcion: sueldo.descripcion,
      id_cargo: sueldo.id_cargo
    });
    setEditingId(sueldo.id_sueldo);
    setShowForm(true);
  };

  const eliminarSueldo = async (id) => {
    if (window.confirm('¿Eliminar sueldo?')) {
      await supabase.from('sueldos').delete().eq('id_sueldo', id);
      cargarDatos();
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Sueldos
      </h1>

      <button
        onClick={() => {
          setShowForm(true);
          setEditingId(null); // Nuevo sueldo
          setForm({ monto: '', descripcion: '', id_cargo: '' });
        }}
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
        Nuevo Sueldo
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>
            {editingId ? 'Editar Sueldo' : 'Nuevo Sueldo'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Monto (Bs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => setForm({...form, monto: e.target.value})}
                  required
                  min="0"
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
                  Cargo
                </label>
                <select
                  value={form.id_cargo}
                  onChange={(e) => setForm({...form, id_cargo: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
                  }}
                >
                  <option value="">Seleccionar cargo</option>
                  {cargos.map(cargo => (
                    <option key={cargo.id_cargo} value={cargo.id_cargo}>
                      {cargo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({...form, descripcion: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  minHeight: "60px"
                }}
              />
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
                  setForm({ monto: '', descripcion: '', id_cargo: '' });
                  setEditingId(null);
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Sueldos</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Monto</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Cargo</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Descripción</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sueldos.map(sueldo => (
              <tr key={sueldo.id_sueldo}>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{sueldo.id_sueldo}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(sueldo.monto)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {cargos.find(c => c.id_cargo === sueldo.id_cargo)?.nombre || 'N/A'}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{sueldo.descripcion}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5", display: "flex", gap: "5px" }}>
                  <button 
                    onClick={() => editarSueldo(sueldo)}
                    style={{ 
                      padding: "5px 10px", 
                      backgroundColor: "#ffc107", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => eliminarSueldo(sueldo.id_sueldo)}
                    style={{ 
                      padding: "5px 10px", 
                      backgroundColor: "#dc3545", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
