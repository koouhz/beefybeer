// src/pages/Ventas.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../bd/supabaseClient";
import { Edit, Trash2, Plus, TrendingUp, Calendar, DollarSign } from "lucide-react";

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoProductos, setPedidoProductos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventasLoading, setVentasLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    descripcion: '',
    id_pedido: '',
    monto_total: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [ventasRes, pedidosRes, pedidoProductosRes, productosRes] = await Promise.all([
        supabase.from('ventas').select('*').order('fecha', { ascending: false }),
        supabase.from('pedidos').select('*'),
        supabase.from('pedido_producto').select('*'),
        supabase.from('productos').select('*')
      ]);
      
      if (ventasRes.error) throw ventasRes.error;
      if (pedidosRes.error) throw pedidosRes.error;
      if (pedidoProductosRes.error) throw pedidoProductosRes.error;
      if (productosRes.error) throw productosRes.error;
      
      setVentas(ventasRes.data || []);
      setPedidos(pedidosRes.data || []);
      setPedidoProductos(pedidoProductosRes.data || []);
      setProductos(productosRes.data || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar datos: ' + error.message);
    }
    setVentasLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('ventas')
        .insert([{
          ...form,
          monto_total: parseFloat(form.monto_total)
        }]);
      
      if (error) throw error;
      setForm({ descripcion: '', id_pedido: '', monto_total: '' });
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear venta: ' + error.message);
    }
  };

  const eliminarVenta = async (id) => {
    if (window.confirm('¿Eliminar venta?')) {
      try {
        const { error } = await supabase.from('ventas').delete().eq('id_venta', id);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar venta: ' + error.message);
      }
    }
  };

  const getPedidoDetalle = (id_pedido) => {
    const pedido = pedidos.find(p => p.id_pedido === id_pedido);
    return pedido ? `Pedido #${pedido.id_pedido} - Mesa ${pedido.nromesa || 'N/A'}` : 'N/A';
  };

  const getDetalleProductos = (id_pedido) => {
    const productosPedido = pedidoProductos.filter(pp => pp.id_pedido === id_pedido);
    const detalles = productosPedido.map(pp => {
      const producto = productos.find(p => p.id_producto === pp.id_producto);
      return producto ? `${producto.nombre} (x${pp.cantidad})` : `Producto #${pp.id_producto} (x${pp.cantidad})`;
    });
    return detalles.join(', ');
  };

  const getTotalVentas = () => {
    return ventas.reduce((sum, venta) => sum + (venta.monto_total || 0), 0);
  };

  const getVentasHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    return ventas.filter(v => v.fecha?.split('T')[0] === hoy)
                .reduce((sum, venta) => sum + (venta.monto_total || 0), 0);
  };

  if (ventasLoading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Ventas
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
            }).format(getTotalVentas())}
          </h3>
          <p style={{ color: "#6d4611", fontSize: "14px", margin: 0 }}>Total Ventas</p>
        </div>
        
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <Calendar size={24} style={{ color: "#7a3b06", marginBottom: "10px" }} />
          <h3 style={{ color: "#7a3b06", margin: "10px 0 5px 0" }}>
            {new Intl.NumberFormat('es-BO', { 
              style: 'currency', 
              currency: 'BOB' 
            }).format(getVentasHoy())}
          </h3>
          <p style={{ color: "#6d4611", fontSize: "14px", margin: 0 }}>Ventas Hoy</p>
        </div>
        
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          border: "1px solid #e9d8b5",
          textAlign: "center"
        }}>
          <TrendingUp size={24} style={{ color: "#7a3b06", marginBottom: "10px" }} />
          <h3 style={{ color: "#7a3b06", margin: "10px 0 5px 0" }}>
            {ventas.length}
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
        Nueva Venta
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Nueva Venta</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Pedido
                </label>
                <select
                  value={form.id_pedido}
                  onChange={(e) => setForm({...form, id_pedido: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px"
                  }}
                >
                  <option value="">Seleccionar pedido</option>
                  {pedidos.map(pedido => (
                    <option key={pedido.id_pedido} value={pedido.id_pedido}>
                      Pedido #{pedido.id_pedido} - Mesa {pedido.nromesa || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Monto Total (Bs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monto_total}
                  onChange={(e) => setForm({...form, monto_total: e.target.value})}
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
                Guardar Venta
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ descripcion: '', id_pedido: '', monto_total: '' });
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Historial de Ventas</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Fecha</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Pedido</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Productos</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Descripción</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Monto Total</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(venta => (
              <tr key={venta.id_venta}>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{venta.id_venta}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {venta.fecha ? new Date(venta.fecha).toLocaleString('es-ES') : 'N/A'}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {getPedidoDetalle(venta.id_pedido)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {getDetalleProductos(venta.id_pedido)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {venta.descripcion || '-'}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5", fontWeight: "bold", color: "#7a3b06" }}>
                  {new Intl.NumberFormat('es-BO', { 
                    style: 'currency', 
                    currency: 'BOB' 
                  }).format(venta.monto_total || 0)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => {
                        setForm({
                          descripcion: venta.descripcion,
                          id_pedido: venta.id_pedido,
                          monto_total: venta.monto_total
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
                      onClick={() => eliminarVenta(venta.id_venta)}
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