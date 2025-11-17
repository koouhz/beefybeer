import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Personal() {
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ci: '',
    nombre: '',
    pat: '',
    mat: '',
    fecha_nac: '',
    id_rol: '',
    id_cargo: ''
  });
  const [editingCi, setEditingCi] = useState(null); // <-- para editar

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [empleadosRes, rolesRes, cargosRes] = await Promise.all([
        supabase.from('empleados').select('*'),
        supabase.from('roles').select('*'),
        supabase.from('cargos').select('*')
      ]);
      
      setEmpleados(empleadosRes.data || []);
      setRoles(rolesRes.data || []);
      setCargos(cargosRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCi) {
        // Actualizar empleado
        const { error } = await supabase
          .from('empleados')
          .update(form)
          .eq('ci', editingCi);
        if (error) throw error;
      } else {
        // Nuevo empleado
        const { error } = await supabase
          .from('empleados')
          .insert([form]);
        if (error) throw error;
      }

      setForm({
        ci: '',
        nombre: '',
        pat: '',
        mat: '',
        fecha_nac: '',
        id_rol: '',
        id_cargo: ''
      });
      setEditingCi(null);
      setShowForm(false);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const editarEmpleado = (empleado) => {
    setForm({
      ci: empleado.ci,
      nombre: empleado.nombre,
      pat: empleado.pat,
      mat: empleado.mat,
      fecha_nac: empleado.fecha_nac,
      id_rol: empleado.id_rol,
      id_cargo: empleado.id_cargo
    });
    setEditingCi(empleado.ci);
    setShowForm(true);
  };

  const eliminarEmpleado = async (ci) => {
    if (window.confirm('¿Eliminar empleado?')) {
      await supabase.from('empleados').delete().eq('ci', ci);
      cargarDatos();
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "30px" }}>
        Gestión de Personal
      </h1>

      <button
        onClick={() => {
          setShowForm(true);
          setEditingCi(null);
          setForm({
            ci: '',
            nombre: '',
            pat: '',
            mat: '',
            fecha_nac: '',
            id_rol: '',
            id_cargo: ''
          });
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
        Nuevo Empleado
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
            {editingCi ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h3>
          <form onSubmit={handleSubmit}>
            {/* Aquí van los inputs como antes, no los repito por brevedad */}
            {/* ... */}
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
                  setEditingCi(null);
                  setForm({
                    ci: '',
                    nombre: '',
                    pat: '',
                    mat: '',
                    fecha_nac: '',
                    id_rol: '',
                    id_cargo: ''
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
        <h2 style={{ color: "#7a3b06", marginBottom: "15px" }}>Personal</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f5ee" }}>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>CI</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Nombre</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Apellido</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Cargo</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Rol</th>
              <th style={{ padding: "10px", border: "1px solid #e9d8b5" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(empleado => (
              <tr key={empleado.ci}>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{empleado.ci}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{empleado.nombre}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>{empleado.pat} {empleado.mat}</td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {cargos.find(c => c.id_cargo === empleado.id_cargo)?.nombre || 'N/A'}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5" }}>
                  {roles.find(r => r.id_rol === empleado.id_rol)?.nombre || 'N/A'}
                </td>
                <td style={{ padding: "10px", border: "1px solid #e9d8b5", display: "flex", gap: "5px" }}>
                  <button 
                    onClick={() => editarEmpleado(empleado)}
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
                    onClick={() => eliminarEmpleado(empleado.ci)}
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
