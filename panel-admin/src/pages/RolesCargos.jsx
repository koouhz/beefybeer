// src/pages/RolesCargos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { Edit, Trash2, Plus, User, Briefcase } from "lucide-react";

export default function RolesCargos() {
  const [roles, setRoles] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [sueldos, setSueldos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para formularios
  const [showRolForm, setShowRolForm] = useState(false);
  const [showCargoForm, setShowCargoForm] = useState(false);
  const [showSueldoForm, setShowSueldoForm] = useState(false);
  
  const [rolForm, setRolForm] = useState({ nombre: '', descripcion: '' });
  const [cargoForm, setCargoForm] = useState({ nombre: '', descripcion: '' });
  const [sueldoForm, setSueldoForm] = useState({ monto: '', descripcion: '', id_cargo: '' });

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesData, cargosData, sueldosData] = await Promise.all([
        supabase.from('roles').select('*'),
        supabase.from('cargos').select('*'),
        supabase.from('sueldos').select('*').order('id_sueldo')
      ]);

      setRoles(rolesData.data || []);
      setCargos(cargosData.data || []);
      setSueldos(sueldosData.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para roles
  const handleCreateRol = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('roles')
        .insert([rolForm]);
      
      if (error) throw error;
      
      setRolForm({ nombre: '', descripcion: '' });
      setShowRolForm(false);
      loadData();
    } catch (error) {
      console.error('Error creando rol:', error);
    }
  };

  const handleUpdateRol = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id_rol', id);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error actualizando rol:', error);
    }
  };

  const handleDeleteRol = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        const { error } = await supabase
          .from('roles')
          .delete()
          .eq('id_rol', id);
        
        if (error) throw error;
        loadData();
      } catch (error) {
        console.error('Error eliminando rol:', error);
      }
    }
  };

  // Funciones para cargos
  const handleCreateCargo = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('cargos')
        .insert([cargoForm]);
      
      if (error) throw error;
      
      setCargoForm({ nombre: '', descripcion: '' });
      setShowCargoForm(false);
      loadData();
    } catch (error) {
      console.error('Error creando cargo:', error);
    }
  };

  const handleUpdateCargo = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('cargos')
        .update(updates)
        .eq('id_cargo', id);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error actualizando cargo:', error);
    }
  };

  const handleDeleteCargo = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cargo?')) {
      try {
        const { error } = await supabase
          .from('cargos')
          .delete()
          .eq('id_cargo', id);
        
        if (error) throw error;
        loadData();
      } catch (error) {
        console.error('Error eliminando cargo:', error);
      }
    }
  };

  // Funciones para sueldos
  const handleCreateSueldo = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('sueldos')
        .insert([{
          ...sueldoForm,
          monto: parseFloat(sueldoForm.monto)
        }]);
      
      if (error) throw error;
      
      setSueldoForm({ monto: '', descripcion: '', id_cargo: '' });
      setShowSueldoForm(false);
      loadData();
    } catch (error) {
      console.error('Error creando sueldo:', error);
    }
  };

  const handleUpdateSueldo = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('sueldos')
        .update({
          ...updates,
          monto: parseFloat(updates.monto)
        })
        .eq('id_sueldo', id);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error actualizando sueldo:', error);
    }
  };

  const handleDeleteSueldo = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este sueldo?')) {
      try {
        const { error } = await supabase
          .from('sueldos')
          .delete()
          .eq('id_sueldo', id);
        
        if (error) throw error;
        loadData();
      } catch (error) {
        console.error('Error eliminando sueldo:', error);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "20px" }}>
          Roles y Cargos
        </h1>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
          Gestión de Roles y Cargos
        </h1>
        <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
          Administra roles, cargos y sueldos del personal
        </p>
      </header>

      {/* Botones para mostrar formularios */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowRolForm(true)}
          style={{
            padding: "12px 20px",
            backgroundColor: "#7a3b06",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <Plus size={16} />
          Nuevo Rol
        </button>
        
        <button
          onClick={() => setShowCargoForm(true)}
          style={{
            padding: "12px 20px",
            backgroundColor: "#6d4611",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <Plus size={16} />
          Nuevo Cargo
        </button>
        
        <button
          onClick={() => setShowSueldoForm(true)}
          style={{
            padding: "12px 20px",
            backgroundColor: "#5d3a05",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <Plus size={16} />
          Nuevo Sueldo
        </button>
      </div>

      {/* Formulario de Rol */}
      {showRolForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px", fontSize: "18px" }}>
            Nuevo Rol
          </h3>
          <form onSubmit={handleCreateRol}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Nombre del Rol
              </label>
              <input
                type="text"
                value={rolForm.nombre}
                onChange={(e) => setRolForm({...rolForm, nombre: e.target.value})}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Descripción
              </label>
              <textarea
                value={rolForm.descripcion}
                onChange={(e) => setRolForm({...rolForm, descripcion: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minHeight: "60px",
                  resize: "vertical"
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
                  setShowRolForm(false);
                  setRolForm({ nombre: '', descripcion: '' });
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

      {/* Formulario de Cargo */}
      {showCargoForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px", fontSize: "18px" }}>
            Nuevo Cargo
          </h3>
          <form onSubmit={handleCreateCargo}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Nombre del Cargo
              </label>
              <input
                type="text"
                value={cargoForm.nombre}
                onChange={(e) => setCargoForm({...cargoForm, nombre: e.target.value})}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                Descripción
              </label>
              <textarea
                value={cargoForm.descripcion}
                onChange={(e) => setCargoForm({...cargoForm, descripcion: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minHeight: "60px",
                  resize: "vertical"
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
                  setShowCargoForm(false);
                  setCargoForm({ nombre: '', descripcion: '' });
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

      {/* Formulario de Sueldo */}
      {showSueldoForm && (
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#7a3b06", marginBottom: "15px", fontSize: "18px" }}>
            Nuevo Sueldo
          </h3>
          <form onSubmit={handleCreateSueldo}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Monto (Bs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sueldoForm.monto}
                  onChange={(e) => setSueldoForm({...sueldoForm, monto: e.target.value})}
                  required
                  min="0"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#6d4611" }}>
                  Cargo
                </label>
                <select
                  value={sueldoForm.id_cargo}
                  onChange={(e) => setSueldoForm({...sueldoForm, id_cargo: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "6px",
                    fontSize: "14px"
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
                value={sueldoForm.descripcion}
                onChange={(e) => setSueldoForm({...sueldoForm, descripcion: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minHeight: "60px",
                  resize: "vertical"
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
                  setShowSueldoForm(false);
                  setSueldoForm({ monto: '', descripcion: '', id_cargo: '' });
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

      {/* Tablas */}
      <div style={{ display: "grid", gap: "30px", width: "100%" }}>
        {/* Roles */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e9d8b5", overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #e9d8b5", display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={20} style={{ color: "#7a3b06" }} />
            <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "20px" }}>Roles</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f5ee" }}>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Nombre</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Descripción</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(rol => (
                  <tr key={rol.id_rol}>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{rol.id_rol}</td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{rol.nombre}</td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{rol.descripcion}</td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            setRolForm({ nombre: rol.nombre, descripcion: rol.descripcion });
                            setShowRolForm(true);
                            // Aquí necesitarías manejar la actualización
                          }}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "#ffc107",
                            color: "#7a3b06",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRol(rol.id_rol)}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
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

        {/* Cargos */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e9d8b5", overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #e9d8b5", display: "flex", alignItems: "center", gap: "10px" }}>
            <Briefcase size={20} style={{ color: "#7a3b06" }} />
            <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "20px" }}>Cargos</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f5ee" }}>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Nombre</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Descripción</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargos.map(cargo => (
                  <tr key={cargo.id_cargo}>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{cargo.id_cargo}</td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{cargo.nombre}</td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{cargo.descripcion}</td>
                    <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            setCargoForm({ nombre: cargo.nombre, descripcion: cargo.descripcion });
                            setShowCargoForm(true);
                            // Aquí necesitarías manejar la actualización
                          }}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "#ffc107",
                            color: "#7a3b06",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCargo(cargo.id_cargo)}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
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

        {/* Sueldos */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e9d8b5", overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #e9d8b5", display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={20} style={{ color: "#7a3b06" }} />
            <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "20px" }}>Sueldos</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f5ee" }}>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Monto (Bs)</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Cargo</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Descripción</th>
                  <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e9d8b5", color: "#6d4611" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sueldos.map(sueldo => {
                  const cargo = cargos.find(c => c.id_cargo === sueldo.id_cargo);
                  return (
                    <tr key={sueldo.id_sueldo}>
                      <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{sueldo.id_sueldo}</td>
                      <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                        {new Intl.NumberFormat('es-BO', { 
                          style: 'currency', 
                          currency: 'BOB' 
                        }).format(sueldo.monto)}
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                        {cargo ? cargo.nombre : 'N/A'}
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>{sueldo.descripcion}</td>
                      <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => {
                              setSueldoForm({ 
                                monto: sueldo.monto, 
                                descripcion: sueldo.descripcion, 
                                id_cargo: sueldo.id_cargo 
                              });
                              setShowSueldoForm(true);
                              // Aquí necesitarías manejar la actualización
                            }}
                            style={{
                              padding: "6px 10px",
                              backgroundColor: "#ffc107",
                              color: "#7a3b06",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSueldo(sueldo.id_sueldo)}
                            style={{
                              padding: "6px 10px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
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
      </div>
    </div>
  );
}