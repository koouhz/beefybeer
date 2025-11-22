import { useState, useEffect } from "react";
import { supabase } from "../../bd/supabaseClient";
import { Edit, Trash2, Plus, Save, X } from "lucide-react";

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
    id_cargo: '',
    email: '',
    password: ''
  });
  const [editingCi, setEditingCi] = useState(null);
  const [error, setError] = useState('');

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
      
      if (empleadosRes.error) throw empleadosRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (cargosRes.error) throw cargosRes.error;
      
      setEmpleados(empleadosRes.data || []);
      setRoles(rolesRes.data || []);
      setCargos(cargosRes.data || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los datos');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validaciones básicas
      if (!form.ci || !form.nombre || !form.pat || !form.fecha_nac) {
        setError('CI, Nombre, Apellido Paterno y Fecha de Nacimiento son obligatorios');
        return;
      }

      if (editingCi) {
        // Actualizar empleado
        const { error } = await supabase
          .from('empleados')
          .update({
            nombre: form.nombre,
            pat: form.pat,
            mat: form.mat,
            fecha_nac: form.fecha_nac,
            id_rol: form.id_rol || null,
            id_cargo: form.id_cargo || null,
            email: form.email || null,
            password: form.password || null
          })
          .eq('ci', editingCi);
        
        if (error) throw error;
      } else {
        // Nuevo empleado - verificar si ya existe el CI
        const { data: existe } = await supabase
          .from('empleados')
          .select('ci')
          .eq('ci', form.ci)
          .single();

        if (existe) {
          setError('Ya existe un empleado con este CI');
          return;
        }

        const { error } = await supabase
          .from('empleados')
          .insert([{
            ci: form.ci,
            nombre: form.nombre,
            pat: form.pat,
            mat: form.mat,
            fecha_nac: form.fecha_nac,
            id_rol: form.id_rol || null,
            id_cargo: form.id_cargo || null,
            email: form.email || null,
            password: form.password || null
          }]);
        
        if (error) throw error;
      }

      // Limpiar formulario y recargar datos
      setForm({
        ci: '',
        nombre: '',
        pat: '',
        mat: '',
        fecha_nac: '',
        id_rol: '',
        id_cargo: '',
        email: '',
        password: ''
      });
      setEditingCi(null);
      setShowForm(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar: ' + error.message);
    }
  };

  const editarEmpleado = (empleado) => {
    setForm({
      ci: empleado.ci,
      nombre: empleado.nombre,
      pat: empleado.pat,
      mat: empleado.mat || '',
      fecha_nac: empleado.fecha_nac,
      id_rol: empleado.id_rol || '',
      id_cargo: empleado.id_cargo || '',
      email: empleado.email || '',
      password: '' // No mostrar contraseña por seguridad
    });
    setEditingCi(empleado.ci);
    setShowForm(true);
    setError('');
  };

  const eliminarEmpleado = async (ci) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        const { error } = await supabase
          .from('empleados')
          .delete()
          .eq('ci', ci);
        
        if (error) throw error;
        
        await cargarDatos();
      } catch (error) {
        console.error('Error:', error);
        setError('Error al eliminar empleado');
      }
    }
  };

  const resetForm = () => {
    setForm({
      ci: '',
      nombre: '',
      pat: '',
      mat: '',
      fecha_nac: '',
      id_rol: '',
      id_cargo: '',
      email: '',
      password: ''
    });
    setEditingCi(null);
    setShowForm(false);
    setError('');
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "40px", 
        textAlign: "center", 
        color: "#7a3b06",
        fontSize: "18px" 
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px" }}>
          Gestión de Personal
        </h1>
        <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
          Administra el personal del restaurante
        </p>
      </header>

      {/* Botón Nuevo Empleado */}
      <div style={{ marginBottom: "20px" }}>
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
              id_cargo: '',
              email: '',
              password: ''
            });
          }}
          style={{
            padding: "12px 24px",
            backgroundColor: "#7a3b06",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#6d4611";
            e.target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#7a3b06";
            e.target.style.transform = "translateY(0)";
          }}
        >
          <Plus size={18} />
          Nuevo Empleado
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div style={{
          background: "#fee",
          border: "1px solid #f5c6cb",
          color: "#721c24",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(122, 59, 6, 0.1)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h3 style={{ 
              color: "#7a3b06", 
              margin: 0,
              fontSize: "20px",
              fontWeight: "600"
            }}>
              {editingCi ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h3>
            <button
              onClick={resetForm}
              style={{
                background: "none",
                border: "none",
                color: "#7a3b06",
                cursor: "pointer",
                padding: "5px"
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
              marginBottom: "20px"
            }}>
              {/* CI */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Cédula de Identidad *
                </label>
                <input
                  type="text"
                  name="ci"
                  value={form.ci}
                  onChange={(e) => setForm({...form, ci: e.target.value})}
                  required
                  disabled={!!editingCi}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: editingCi ? "#f5f5f5" : "white"
                  }}
                  placeholder="Ingrese CI"
                />
              </div>

              {/* Nombre */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06"
                  }}
                  placeholder="Ingrese nombre"
                />
              </div>

              {/* Apellido Paterno */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="pat"
                  value={form.pat}
                  onChange={(e) => setForm({...form, pat: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06"
                  }}
                  placeholder="Ingrese apellido paterno"
                />
              </div>

              {/* Apellido Materno */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="mat"
                  value={form.mat}
                  onChange={(e) => setForm({...form, mat: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06"
                  }}
                  placeholder="Ingrese apellido materno"
                />
              </div>

              {/* Fecha Nacimiento */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="fecha_nac"
                  value={form.fecha_nac}
                  onChange={(e) => setForm({...form, fecha_nac: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06"
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06"
                  }}
                  placeholder="Ingrese email"
                />
              </div>

              {/* Contraseña (solo para nuevo) */}
              {!editingCi && (
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#7a3b06",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#7a3b06"
                    }}
                    placeholder="Ingrese contraseña"
                  />
                </div>
              )}

              {/* Cargo */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Cargo
                </label>
                <select
                  name="id_cargo"
                  value={form.id_cargo}
                  onChange={(e) => setForm({...form, id_cargo: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "white"
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

              {/* Rol */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Rol
                </label>
                <select
                  name="id_rol"
                  value={form.id_rol}
                  onChange={(e) => setForm({...form, id_rol: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map(rol => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                <Save size={16} />
                {editingCi ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de empleados */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        border: "1px solid #e9d8b5", 
        padding: "20px",
        overflow: "auto"
      }}>
        <h2 style={{ 
          color: "#7a3b06", 
          marginBottom: "20px",
          fontSize: "20px",
          fontWeight: "600"
        }}>
          Lista de Personal ({empleados.length})
        </h2>
        
        {empleados.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px", 
            color: "#6d4611",
            fontSize: "16px"
          }}>
            No hay empleados registrados
          </div>
        ) : (
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            minWidth: "800px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f5ee" }}>
                <th style={{ 
                  padding: "12px", 
                  border: "1px solid #e9d8b5",
                  textAlign: "left",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>CI</th>
                <th style={{ 
                  padding: "12px", 
                  border: "1px solid #e9d8b5",
                  textAlign: "left",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>Nombre Completo</th>
                <th style={{ 
                  padding: "12px", 
                  border: "1px solid #e9d8b5",
                  textAlign: "left",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>Fecha Nac.</th>
                <th style={{ 
                  padding: "12px", 
                  border: "1px solid #e9d8b5",
                  textAlign: "left",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>Cargo</th>
                <th style={{ 
                  padding: "12px", 
                  border: "1px solid #e9d8b5",
                  textAlign: "left",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>Rol</th>
                <th style={{ 
                  padding: "12px", 
                  border: "1px solid #e9d8b5",
                  textAlign: "left",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map(empleado => (
                <tr key={empleado.ci} style={{ borderBottom: "1px solid #e9d8b5" }}>
                  <td style={{ 
                    padding: "12px", 
                    border: "1px solid #e9d8b5",
                    color: "#7a3b06",
                    fontSize: "14px"
                  }}>{empleado.ci}</td>
                  <td style={{ 
                    padding: "12px", 
                    border: "1px solid #e9d8b5",
                    color: "#7a3b06",
                    fontSize: "14px"
                  }}>
                    <div style={{ fontWeight: "500" }}>{empleado.nombre}</div>
                    <div style={{ fontSize: "12px", color: "#6d4611", opacity: 0.8 }}>
                      {empleado.pat} {empleado.mat}
                    </div>
                    {empleado.email && (
                      <div style={{ fontSize: "12px", color: "#6d4611" }}>
                        {empleado.email}
                      </div>
                    )}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    border: "1px solid #e9d8b5",
                    color: "#7a3b06",
                    fontSize: "14px"
                  }}>
                    {new Date(empleado.fecha_nac).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    border: "1px solid #e9d8b5",
                    color: "#7a3b06",
                    fontSize: "14px"
                  }}>
                    {cargos.find(c => c.id_cargo === empleado.id_cargo)?.nombre || 'N/A'}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    border: "1px solid #e9d8b5",
                    color: "#7a3b06",
                    fontSize: "14px"
                  }}>
                    {roles.find(r => r.id_rol === empleado.id_rol)?.nombre || 'N/A'}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    border: "1px solid #e9d8b5",
                    display: "flex", 
                    gap: "8px" 
                  }}>
                    <button 
                      onClick={() => editarEmpleado(empleado)}
                      style={{ 
                        padding: "8px", 
                        backgroundColor: "#ffc107", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#e0a800";
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#ffc107";
                        e.target.style.transform = "scale(1)";
                      }}
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => eliminarEmpleado(empleado.ci)}
                      style={{ 
                        padding: "8px", 
                        backgroundColor: "#dc3545", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#c82333";
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#dc3545";
                        e.target.style.transform = "scale(1)";
                      }}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}