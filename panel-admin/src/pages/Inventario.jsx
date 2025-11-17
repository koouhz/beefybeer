// src/pages/Inventario.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { Edit, Trash2, Plus, Package } from "lucide-react";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id_producto: '',
    fecha: '',
    observaciones: '',
    entradas: 0,
    salidas: 0,
    stock_minimo: 0,
    stock_maximo: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [inventarioRes, productosRes] = await Promise.all([
        supabase.from('inventario').select('*').order('fecha', { ascending: false }),
        supabase.from('productos').select('*')
      ]);
      
      setInventario(inventarioRes.data || []);
      setProductos(productosRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('inventario')
        .insert([{
          ...form,
          entradas: parseInt(form.entradas),
          salidas: parseInt(form.salidas),
          stock_minimo: parseInt(form.stock_minimo),
          stock_maximo: parseInt(form.stock_maximo)
        }]);
      
      if (error) throw error;
      setForm({
        id_producto: '',
        fecha: '',
        observaciones: '',
        entradas: 0,
        salidas: 0,
        stock_minimo: 0,
        stock_maximo: 0
      });
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarInventario = async (id) => {
    if (window.confirm('¿Eliminar registro de inventario?')) {
      await supabase.from('inventario').delete().eq('id_inventario', id);
      cargarDatos();
    }
  };

  const actualizarInventario = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('inventario')
        .update(updates)
        .eq('id_inventario', id);
      
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
        Gestión de Inventario
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
        Nuevo Registro
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Nuevo Registro de Inventario</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Producto
                </label>
                <select
                  value={form.id_producto}
                  onChange={(e) => setForm({...form, id_producto: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
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
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Fecha
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({...form, fecha: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Entradas
                </label>
                <input
                  type="number"
                  value={form.entradas}
                  onChange={(e) => setForm({...form, entradas: e.target.value})}
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
                  Salidas
                </label>
                <input
                  type="number"
                  value={form.salidas}
                  onChange={(e) => setForm({...form, salidas: e.target.value})}
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
                  Stock Actual
                </label>
                <input
                  type="number"
                  value={form.cantidad_actual || 0}
                  onChange={(e) => setForm({...form, cantidad_actual: e.target.value})}
                  min="0"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={form.stock_minimo}
                  onChange={(e) => setForm({...form, stock_minimo: e.target.value})}
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
                  Stock Máximo
                </label>
                <input
                  type="number"
                  value={form.stock_maximo}
                  onChange={(e) => setForm({...form, stock_maximo: e.target.value})}
                  min="0"
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
                Observaciones
              </label>
              <textarea
                value={form.observaciones}
                onChange={(e) => setForm({...form, observaciones: e.target.value})}
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
                  setForm({
                    id_producto: '',
                    fecha: '',
                    observaciones: '',
                    entradas: 0,
                    salidas: 0,
                    stock_minimo: 0,
                    stock_maximo: 0
                  });
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Inventario</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Producto</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Fecha</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Entradas</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Salidas</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Stock Actual</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Stock Min</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Stock Max</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map(item => {
              const producto = productos.find(p => p.id_producto === item.id_producto);
              return (
                <tr key={item.id_inventario}>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{item.id_inventario}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                    {producto ? producto.nombre : 'N/A'}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{item.fecha}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{item.entradas}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{item.salidas}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{item.cantidad_actual || 0}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{item.stock_minimo}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{item.stock_maximo}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button 
                        onClick={() => {
                          setForm({
                            id_producto: item.id_producto,
                            fecha: item.fecha,
                            observaciones: item.observaciones,
                            entradas: item.entradas,
                            salidas: item.salidas,
                            stock_minimo: item.stock_minimo,
                            stock_maximo: item.stock_maximo,
                            cantidad_actual: item.cantidad_actual
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
                        onClick={() => eliminarInventario(item.id_inventario)}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}