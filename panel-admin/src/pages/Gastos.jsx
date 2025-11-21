// src/pages/Gastos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { Edit, Trash2, Plus, DollarSign } from "lucide-react";

export default function Gastos() {
  const [egresos, setEgresos] = useState([]);
  const [sueldos, setSueldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    detalle: '',
    monto: '',
    id_sueldo: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [egresosRes, sueldosRes] = await Promise.all([
        supabase.from('egresos').select('*').order('id_egreso', { ascending: false }),
        supabase.from('sueldos').select('*')
      ]);
      
      if (egresosRes.error) throw egresosRes.error;
      if (sueldosRes.error) throw sueldosRes.error;
      
      setEgresos(egresosRes.data || []);
      setSueldos(sueldosRes.data || []);
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
        .from('egresos')
        .insert([{
          ...form,
          monto: parseFloat(form.monto)
        }]);
      
      if (error) throw error;
      setForm({ detalle: '', monto: '', id_sueldo: '' });
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear gasto: ' + error.message);
    }
  };

  const eliminarGasto = async (id) => {
    if (window.confirm('¿Eliminar gasto?')) {
      try {
        const { error } = await supabase.from('egresos').delete().eq('id_egreso', id);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar gasto: ' + error.message);
      }
    }
  };

  const getSueldoCargo = (id_sueldo) => {
    const sueldo = sueldos.find(s => s.id_sueldo === id_sueldo);
    return sueldo ? `Bs. ${sueldo.monto} - ${sueldo.descripcion || 'Sueldo'}` : 'N/A';
  };

  const getTotalGastos = () => {
    return egresos.reduce((sum, egreso) => sum + (egreso.monto || 0), 0);
  };

  const getGastosHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    return egresos.reduce((sum, egreso) => {
      const fecha = new Date(egreso.fecha || egreso.fecha_registro).toISOString().split('T')[0];
      if (fecha === hoy) {
        return sum + (egreso.monto || 0);
      }
      return sum;
    }, 0);
  };

  if (loading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Gastos
      </h1>

      {/* Estadísticas */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "20px", 
        marginBottom: "30px" 
      }}>
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <DollarSign size={24} style={{ color: "#7a3b06", marginBottom: "10px" }} />
          <h3 style={{ color: "#7a3b06", margin: "10px 0 5px 0" }}>
            {new Intl.NumberFormat('es-BO', { 
              style: 'currency', 
              currency: 'BOB' 
            }).format(getTotalGastos())}
          </h3>
          <p style={{ color: "#6d4611", fontSize: "14px", margin: 0 }}>Total Gastos</p>
        </div>
        
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <DollarSign size={24} style={{ color: "#7a3b06", marginBottom: "10px" }} />
          <h3 style={{ color: "#7a3b06", margin: "10px 0 5px 0" }}>
            {new Intl.NumberFormat('es-BO', { 
              style: 'currency', 
              currency: 'BOB' 
            }).format(getGastosHoy())}
          </h3>
          <p style={{ color: "#6d4611", fontSize: "14px", margin: 0 }}>Gastos Hoy</p>
        </div>
        
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <DollarSign size={24} style={{ color: "#7a3b06", marginBottom: "10px" }} />
          <h3 style={{ color: "#7a3b06", margin: "10px 0 5px 0" }}>
            {egresos.length}
          </h3>
          <p style={{ color: "#6d4611", fontSize: "14px", margin: 0 }}>Total Registros</p>
        </div>
      </div>

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
        Nuevo Gasto
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Nuevo Gasto</h3>
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
                  Relacionado con Sueldo
                </label>
                <select
                  value={form.id_sueldo}
                  onChange={(e) => setForm({...form, id_sueldo: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
                  }}
                >
                  <option value="">Seleccionar sueldo (opcional)</option>
                  {sueldos.map(sueldo => (
                    <option key={sueldo.id_sueldo} value={sueldo.id_sueldo}>
                      {sueldo.descripcion || 'Sueldo'} - Bs. {sueldo.monto}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Detalle del Gasto
              </label>
              <textarea
                value={form.detalle}
                onChange={(e) => setForm({...form, detalle: e.target.value})}
                required
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
                Guardar Gasto
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ detalle: '', monto: '', id_sueldo: '' });
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Historial de Gastos</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Detalle</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Monto</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Relacionado con</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {egresos.map(egreso => (
              <tr key={egreso.id_egreso}>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{egreso.id_egreso}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{egreso.detalle}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5", fontWeight: "bold", color: "#dc3545" }}>
                  {new Intl.NumberFormat('es-BO', { 
                    style: 'currency', 
                    currency: 'BOB' 
                  }).format(egreso.monto || 0)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {getSueldoCargo(egreso.id_sueldo)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => {
                        setForm({
                          detalle: egreso.detalle,
                          monto: egreso.monto,
                          id_sueldo: egreso.id_sueldo
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
                      onClick={() => eliminarGasto(egreso.id_egreso)}
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