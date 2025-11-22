// src/pages/Proveedores.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../bd/supabaseClient";
import { Edit, Trash2, Plus, Package } from "lucide-react";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    contacto: '',
    id_producto: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [proveedoresRes, productosRes] = await Promise.all([
        supabase.from('proveedores').select('*'),
        supabase.from('productos').select('*')
      ]);
      
      if (proveedoresRes.error) throw proveedoresRes.error;
      if (productosRes.error) throw productosRes.error;
      
      setProveedores(proveedoresRes.data || []);
      setProductos(productosRes.data || []);
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
        .from('proveedores')
        .insert([form]);
      
      if (error) throw error;
      setForm({ contacto: '', id_producto: '' });
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear proveedor: ' + error.message);
    }
  };

  const eliminarProveedor = async (id) => {
    if (window.confirm('¿Eliminar proveedor?')) {
      try {
        const { error } = await supabase.from('proveedores').delete().eq('id_proveedor', id);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar proveedor: ' + error.message);
      }
    }
  };

  const getProductoNombre = (id_producto) => {
    const producto = productos.find(p => p.id_producto === id_producto);
    return producto ? producto.nombre : 'N/A';
  };

  if (loading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Proveedores
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
        Nuevo Proveedor
      </button>

      {showForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Nuevo Proveedor</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Contacto
              </label>
              <input
                type="text"
                value={form.contacto}
                onChange={(e) => setForm({...form, contacto: e.target.value})}
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
                Producto Principal
              </label>
              <select
                value={form.id_producto}
                onChange={(e) => setForm({...form, id_producto: e.target.value})}
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
                  setForm({ contacto: '', id_producto: '' });
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Proveedores</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Contacto</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Producto Principal</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map(proveedor => (
              <tr key={proveedor.id_proveedor}>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{proveedor.id_proveedor}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{proveedor.contacto}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {getProductoNombre(proveedor.id_producto)}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => {
                        setForm({
                          contacto: proveedor.contacto,
                          id_producto: proveedor.id_producto
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
                      onClick={() => eliminarProveedor(proveedor.id_proveedor)}
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