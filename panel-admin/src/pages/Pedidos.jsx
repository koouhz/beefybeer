// src/pages/Pedidos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { Edit, Trash2, Plus, ShoppingCart } from "lucide-react";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidoProductos, setPedidoProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    detalle: '',
    nromesa: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [pedidosRes, mesasRes, productosRes, pedidoProductosRes] = await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('mesas').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('pedido_producto').select('*')
      ]);
      
      setPedidos(pedidosRes.data || []);
      setMesas(mesasRes.data || []);
      setProductos(productosRes.data || []);
      setPedidoProductos(pedidoProductosRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('pedidos')
        .insert([form]);
      
      if (error) throw error;
      setForm({ detalle: '', nromesa: '' });
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarPedido = async (id) => {
    if (window.confirm('¿Eliminar pedido?')) {
      await supabase.from('pedidos').delete().eq('id_pedido', id);
      cargarDatos();
    }
  };

  const getProductoNombre = (id_producto) => {
    const producto = productos.find(p => p.id_producto === id_producto);
    return producto ? producto.nombre : 'N/A';
  };

  const getMesaNumero = (nromesa) => {
    const mesa = mesas.find(m => m.nromesa === nromesa);
    return mesa ? mesa.nromesa : 'N/A';
  };

  if (loading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Pedidos
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
        Nuevo Pedido
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Nuevo Pedido</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Mesa
                </label>
                <select
                  value={form.nromesa}
                  onChange={(e) => setForm({...form, nromesa: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
                  }}
                >
                  <option value="">Seleccionar mesa</option>
                  {mesas.map(mesa => (
                    <option key={mesa.nromesa} value={mesa.nromesa}>
                      Mesa {mesa.nromesa} (Salón {mesa.salon})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Detalle
                </label>
                <textarea
                  value={form.detalle}
                  onChange={(e) => setForm({...form, detalle: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    minHeight: "60px"
                  }}
                />
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
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ detalle: '', nromesa: '' });
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Pedidos</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Mesa</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Detalle</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Productos</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(pedido => {
              const productosPedido = pedidoProductos.filter(pp => pp.id_pedido === pedido.id_pedido);
              return (
                <tr key={pedido.id_pedido}>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{pedido.id_pedido}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                    Mesa {getMesaNumero(pedido.nromesa)}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{pedido.detalle}</td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {productosPedido.map(pp => (
                        <li key={pp.id_pedido_producto}>
                          {getProductoNombre(pp.id_producto)} (x{pp.cantidad})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button 
                        onClick={() => {
                          setForm({
                            detalle: pedido.detalle,
                            nromesa: pedido.nromesa
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
                        onClick={() => eliminarPedido(pedido.id_pedido)}
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