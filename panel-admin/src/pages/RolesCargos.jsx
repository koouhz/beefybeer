// src/pages/RolesCargos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  User, 
  Briefcase, 
  Search,
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Loader
} from "lucide-react";

export default function RolesCargos() {
  const [roles, setRoles] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados para formularios
  const [showRolForm, setShowRolForm] = useState(false);
  const [showCargoForm, setShowCargoForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [rolForm, setRolForm] = useState({ nombre: '', descripcion: '' });
  const [cargoForm, setCargoForm] = useState({ nombre: '', descripcion: '' });

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (message, type = "error") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, cargosData, empleadosData] = await Promise.all([
        supabase.from('roles').select('*').order('id_rol'),
        supabase.from('cargos').select('*').order('id_cargo'),
        supabase.from('empleados').select('ci, nombre, id_cargo, id_rol')
      ]);

      if (rolesData.error) throw rolesData.error;
      if (cargosData.error) throw cargosData.error;
      if (empleadosData.error) throw empleadosData.error;

      setRoles(rolesData.data || []);
      setCargos(cargosData.data || []);
      setEmpleados(empleadosData.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones mejoradas
  const validateRol = (rol) => {
    if (!rol.nombre.trim()) throw new Error("El nombre del rol es requerido");
    if (rol.nombre.length > 50) throw new Error("El nombre no puede exceder 50 caracteres");
    
    // Verificar si ya existe un rol con el mismo nombre (case insensitive)
    const nombreNormalized = rol.nombre.trim().toLowerCase();
    const existeRol = roles.some(r => 
      r.nombre.toLowerCase() === nombreNormalized && 
      r.id_rol !== editingId // Excluir el rol actual si estamos editando
    );
    
    if (existeRol) throw new Error("Ya existe un rol con ese nombre");
  };

  const validateCargo = (cargo) => {
    if (!cargo.nombre.trim()) throw new Error("El nombre del cargo es requerido");
    if (cargo.nombre.length > 50) throw new Error("El nombre no puede exceder 50 caracteres");
    
    // Verificar si ya existe un cargo con el mismo nombre (case insensitive)
    const nombreNormalized = cargo.nombre.trim().toLowerCase();
    const existeCargo = cargos.some(c => 
      c.nombre.toLowerCase() === nombreNormalized && 
      c.id_cargo !== editingId // Excluir el cargo actual si estamos editando
    );
    
    if (existeCargo) throw new Error("Ya existe un cargo con ese nombre");
  };

  // Funciones para roles
  const handleCreateRol = async (e) => {
    e.preventDefault();
    try {
      validateRol(rolForm);
      
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          nombre: rolForm.nombre.trim(),
          descripcion: rolForm.descripcion.trim() || null
        }])
        .select();
      
      if (error) {
        console.error('Error de Supabase:', error);
        if (error.code === '23505') throw new Error("Ya existe un rol con ese nombre");
        throw new Error(`Error del servidor: ${error.message}`);
      }
      
      showMessage("Rol creado exitosamente", "success");
      resetForms();
      await loadData();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleUpdateRol = async (id, updates) => {
    try {
      validateRol(updates);
      
      const { error } = await supabase
        .from('roles')
        .update({
          nombre: updates.nombre.trim(),
          descripcion: updates.descripcion.trim() || null
        })
        .eq('id_rol', id);
      
      if (error) {
        console.error('Error de Supabase:', error);
        if (error.code === '23505') throw new Error("Ya existe un rol con ese nombre");
        throw new Error(`Error del servidor: ${error.message}`);
      }
      
      showMessage("Rol actualizado exitosamente", "success");
      resetForms();
      await loadData();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleDeleteRol = async (id) => {
    const empleadosConRol = empleados.filter(emp => emp.id_rol === id);
    if (empleadosConRol.length > 0) {
      showMessage(`No se puede eliminar. ${empleadosConRol.length} empleado(s) tienen este rol`);
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        const { error } = await supabase.from('roles').delete().eq('id_rol', id);
        if (error) throw error;
        showMessage("Rol eliminado exitosamente", "success");
        await loadData();
      } catch (error) {
        showMessage(`Error eliminando rol: ${error.message}`);
      }
    }
  };

  // Funciones para cargos
  const handleCreateCargo = async (e) => {
    e.preventDefault();
    try {
      validateCargo(cargoForm);
      
      const { data, error } = await supabase
        .from('cargos')
        .insert([{
          nombre: cargoForm.nombre.trim(),
          descripcion: cargoForm.descripcion.trim() || null
        }])
        .select();
      
      if (error) {
        console.error('Error de Supabase:', error);
        if (error.code === '23505') throw new Error("Ya existe un cargo con ese nombre");
        throw new Error(`Error del servidor: ${error.message}`);
      }
      
      showMessage("Cargo creado exitosamente", "success");
      resetForms();
      await loadData();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleUpdateCargo = async (id, updates) => {
    try {
      validateCargo(updates);
      
      const { error } = await supabase
        .from('cargos')
        .update({
          nombre: updates.nombre.trim(),
          descripcion: updates.descripcion.trim() || null
        })
        .eq('id_cargo', id);
      
      if (error) {
        console.error('Error de Supabase:', error);
        if (error.code === '23505') throw new Error("Ya existe un cargo con ese nombre");
        throw new Error(`Error del servidor: ${error.message}`);
      }
      
      showMessage("Cargo actualizado exitosamente", "success");
      resetForms();
      await loadData();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleDeleteCargo = async (id) => {
    const empleadosConCargo = empleados.filter(emp => emp.id_cargo === id);
    if (empleadosConCargo.length > 0) {
      showMessage(`No se puede eliminar. ${empleadosConCargo.length} empleado(s) tienen este cargo`);
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este cargo?')) {
      try {
        const { error } = await supabase.from('cargos').delete().eq('id_cargo', id);
        if (error) throw error;
        showMessage("Cargo eliminado exitosamente", "success");
        await loadData();
      } catch (error) {
        showMessage(`Error eliminando cargo: ${error.message}`);
      }
    }
  };

  // Filtros
  const filteredRoles = roles.filter(rol =>
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rol.descripcion && rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCargos = cargos.filter(cargo =>
    cargo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cargo.descripcion && cargo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset forms
  const resetForms = () => {
    setRolForm({ nombre: '', descripcion: '' });
    setCargoForm({ nombre: '', descripcion: '' });
    setEditingId(null);
    setShowRolForm(false);
    setShowCargoForm(false);
  };

  // Estilos en objetos
  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto"
    },
    pageHeader: {
      marginBottom: "30px"
    },
    pageHeaderH1: {
      fontSize: "28px",
      color: "#7a3b06",
      marginBottom: "8px",
      fontWeight: "700"
    },
    pageHeaderP: {
      color: "#6d4611",
      fontSize: "14px",
      opacity: 0.9
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      color: "#7a3b06"
    },
    alert: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "14px"
    },
    alertError: {
      backgroundColor: "#fee",
      border: "1px solid #f5c6cb",
      color: "#721c24"
    },
    alertSuccess: {
      backgroundColor: "#f0fff4",
      border: "1px solid #c3e6cb",
      color: "#155724"
    },
    alertClose: {
      marginLeft: "auto",
      background: "none",
      border: "none",
      cursor: "pointer",
      opacity: 0.7
    },
    searchBar: {
      marginBottom: "20px"
    },
    searchBox: {
      position: "relative",
      maxWidth: "400px"
    },
    searchInput: {
      width: "100%",
      padding: "12px 12px 12px 40px",
      border: "1px solid #e9d8b5",
      borderRadius: "8px",
      fontSize: "14px"
    },
    actionButtons: {
      display: "flex",
      gap: "12px",
      marginBottom: "30px",
      flexWrap: "wrap"
    },
    btn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s"
    },
    btnPrimary: {
      backgroundColor: "#7a3b06",
      color: "white"
    },
    btnSecondary: {
      backgroundColor: "#6d4611",
      color: "white"
    },
    btnSuccess: {
      backgroundColor: "#28a745",
      color: "white"
    },
    btnCancel: {
      backgroundColor: "#6c757d",
      color: "white"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    },
    modal: {
      background: "white",
      padding: "24px",
      borderRadius: "12px",
      border: "1px solid #e9d8b5",
      maxWidth: "500px",
      width: "100%",
      maxHeight: "90vh",
      overflowY: "auto"
    },
    formGroup: {
      marginBottom: "16px",
      position: "relative"
    },
    formActions: {
      display: "flex",
      gap: "12px",
      marginTop: "24px"
    },
    tablesGrid: {
      display: "grid",
      gap: "24px"
    },
    tableCard: {
      background: "white",
      borderRadius: "12px",
      border: "1px solid #e9d8b5",
      overflow: "hidden"
    },
    tableHeader: {
      padding: "20px",
      borderBottom: "1px solid #e9d8b5",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: "#f8f5ee"
    },
    tableContainer: {
      overflowX: "auto"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "600px"
    },
    th: {
      padding: "12px",
      textAlign: "left",
      border: "1px solid #e9d8b5",
      color: "#6d4611",
      fontWeight: "600",
      backgroundColor: "#f8f5ee"
    },
    td: {
      padding: "12px",
      border: "1px solid #e9d8b5",
      color: "#6d4611"
    },
    idCell: {
      fontWeight: "600",
      color: "#7a3b06"
    },
    descCell: {
      maxWidth: "200px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    countCell: {
      textAlign: "center"
    },
    actionsCell: {
      width: "100px"
    },
    actionButtonsSmall: {
      display: "flex",
      gap: "6px",
      justifyContent: "center"
    },
    btnEdit: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 8px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: "#ffc107",
      color: "#7a3b06"
    },
    btnDelete: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 8px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: "#dc3545",
      color: "white"
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600"
    },
    badgeInfo: {
      backgroundColor: "#e3f2fd",
      color: "#1976d2"
    },
    badgeWarning: {
      backgroundColor: "#fff3e0",
      color: "#f57c00"
    },
    emptyState: {
      padding: "40px 20px",
      textAlign: "center",
      color: "#6d4611",
      opacity: 0.7
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.pageHeader}>
        <h1 style={styles.pageHeaderH1}>Gestión de Roles y Cargos</h1>
        <p style={styles.pageHeaderP}>Administra los roles y cargos del sistema</p>
      </header>

      {/* Alertas */}
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} style={styles.alertClose}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} style={styles.alertClose}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div style={styles.searchBar}>
        <div style={styles.searchBox}>
          <Search size={18} style={{position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6d4611"}} />
          <input
            type="text"
            placeholder="Buscar roles o cargos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            onFocus={(e) => e.target.style.outline = "none"}
            onBlur={(e) => e.target.style.borderColor = "#e9d8b5"}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div style={styles.actionButtons}>
        <button 
          onClick={() => { resetForms(); setShowRolForm(true); }} 
          style={{...styles.btn, ...styles.btnPrimary}}
        >
          <Plus size={16} />
          Nuevo Rol
        </button>
        <button 
          onClick={() => { resetForms(); setShowCargoForm(true); }} 
          style={{...styles.btn, ...styles.btnSecondary}}
        >
          <Plus size={16} />
          Nuevo Cargo
        </button>
      </div>

      {/* Formularios modales */}
      {(showRolForm || showCargoForm) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {showRolForm && (
              <>
                <h3 style={{color: "#7a3b06", marginBottom: "20px", fontSize: "20px"}}>
                  {editingId ? "Editar Rol" : "Nuevo Rol"}
                </h3>
                <form onSubmit={editingId ? 
                  (e) => { e.preventDefault(); handleUpdateRol(editingId, rolForm); } : 
                  handleCreateRol
                }>
                  <div style={styles.formGroup}>
                    <label style={{display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500"}}>
                      Nombre del Rol *
                    </label>
                    <input
                      type="text"
                      value={rolForm.nombre}
                      onChange={(e) => setRolForm({...rolForm, nombre: e.target.value})}
                      required
                      maxLength={50}
                      placeholder="Ej: Administrador"
                      style={{width: "100%", padding: "10px", border: "1px solid #e9d8b5", borderRadius: "6px", fontSize: "14px"}}
                    />
                    <span style={{position: "absolute", right: "10px", bottom: "10px", fontSize: "12px", color: "#6d4611", opacity: 0.7}}>
                      {rolForm.nombre.length}/50
                    </span>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500"}}>
                      Descripción
                    </label>
                    <textarea
                      value={rolForm.descripcion}
                      onChange={(e) => setRolForm({...rolForm, descripcion: e.target.value})}
                      placeholder="Descripción del rol..."
                      rows="3"
                      maxLength={200}
                      style={{width: "100%", padding: "10px", border: "1px solid #e9d8b5", borderRadius: "6px", fontSize: "14px"}}
                    />
                    <span style={{position: "absolute", right: "10px", bottom: "10px", fontSize: "12px", color: "#6d4611", opacity: 0.7}}>
                      {rolForm.descripcion?.length || 0}/200
                    </span>
                  </div>
                  <div style={styles.formActions}>
                    <button type="submit" style={{...styles.btn, ...styles.btnSuccess}}>
                      <Save size={16} />
                      {editingId ? "Actualizar" : "Guardar"}
                    </button>
                    <button type="button" onClick={resetForms} style={{...styles.btn, ...styles.btnCancel}}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}

            {showCargoForm && (
              <>
                <h3 style={{color: "#7a3b06", marginBottom: "20px", fontSize: "20px"}}>
                  {editingId ? "Editar Cargo" : "Nuevo Cargo"}
                </h3>
                <form onSubmit={editingId ? 
                  (e) => { e.preventDefault(); handleUpdateCargo(editingId, cargoForm); } : 
                  handleCreateCargo
                }>
                  <div style={styles.formGroup}>
                    <label style={{display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500"}}>
                      Nombre del Cargo *
                    </label>
                    <input
                      type="text"
                      value={cargoForm.nombre}
                      onChange={(e) => setCargoForm({...cargoForm, nombre: e.target.value})}
                      required
                      maxLength={50}
                      placeholder="Ej: Mesero, Chef"
                      style={{width: "100%", padding: "10px", border: "1px solid #e9d8b5", borderRadius: "6px", fontSize: "14px"}}
                    />
                    <span style={{position: "absolute", right: "10px", bottom: "10px", fontSize: "12px", color: "#6d4611", opacity: 0.7}}>
                      {cargoForm.nombre.length}/50
                    </span>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{display: "block", marginBottom: "6px", color: "#6d4611", fontWeight: "500"}}>
                      Descripción
                    </label>
                    <textarea
                      value={cargoForm.descripcion}
                      onChange={(e) => setCargoForm({...cargoForm, descripcion: e.target.value})}
                      placeholder="Descripción del cargo..."
                      rows="3"
                      maxLength={200}
                      style={{width: "100%", padding: "10px", border: "1px solid #e9d8b5", borderRadius: "6px", fontSize: "14px"}}
                    />
                    <span style={{position: "absolute", right: "10px", bottom: "10px", fontSize: "12px", color: "#6d4611", opacity: 0.7}}>
                      {cargoForm.descripcion?.length || 0}/200
                    </span>
                  </div>
                  <div style={styles.formActions}>
                    <button type="submit" style={{...styles.btn, ...styles.btnSuccess}}>
                      <Save size={16} />
                      {editingId ? "Actualizar" : "Guardar"}
                    </button>
                    <button type="button" onClick={resetForms} style={{...styles.btn, ...styles.btnCancel}}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tablas */}
      <div style={styles.tablesGrid}>
        {/* Roles */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <User size={20} />
            <h2 style={{color: "#7a3b06", margin: 0, fontSize: "18px"}}>
              Roles ({filteredRoles.length})
            </h2>
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Descripción</th>
                  <th style={styles.th}>Empleados</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map(rol => {
                  const empleadosCount = empleados.filter(emp => emp.id_rol === rol.id_rol).length;
                  return (
                    <tr key={rol.id_rol}>
                      <td style={{...styles.td, ...styles.idCell}}>{rol.id_rol}</td>
                      <td style={{...styles.td, fontWeight: "500"}}>{rol.nombre}</td>
                      <td style={{...styles.td, ...styles.descCell}}>{rol.descripcion || '-'}</td>
                      <td style={{...styles.td, ...styles.countCell}}>
                        <span style={{
                          ...styles.badge,
                          ...(empleadosCount > 0 ? styles.badgeWarning : styles.badgeInfo)
                        }}>
                          <Users size={12} />
                          {empleadosCount}
                        </span>
                      </td>
                      <td style={{...styles.td, ...styles.actionsCell}}>
                        <div style={styles.actionButtonsSmall}>
                          <button
                            onClick={() => {
                              setRolForm({ nombre: rol.nombre, descripcion: rol.descripcion || '' });
                              setEditingId(rol.id_rol);
                              setShowRolForm(true);
                            }}
                            style={styles.btnEdit}
                            title="Editar rol"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRol(rol.id_rol)}
                            style={styles.btnDelete}
                            title="Eliminar rol"
                            disabled={empleadosCount > 0}
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
            {filteredRoles.length === 0 && (
              <div style={styles.emptyState}>
                <p>No se encontraron roles</p>
              </div>
            )}
          </div>
        </div>

        {/* Cargos */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <Briefcase size={20} />
            <h2 style={{color: "#7a3b06", margin: 0, fontSize: "18px"}}>
              Cargos ({filteredCargos.length})
            </h2>
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Descripción</th>
                  <th style={styles.th}>Empleados</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCargos.map(cargo => {
                  const empleadosCount = empleados.filter(emp => emp.id_cargo === cargo.id_cargo).length;
                  return (
                    <tr key={cargo.id_cargo}>
                      <td style={{...styles.td, ...styles.idCell}}>{cargo.id_cargo}</td>
                      <td style={{...styles.td, fontWeight: "500"}}>{cargo.nombre}</td>
                      <td style={{...styles.td, ...styles.descCell}}>{cargo.descripcion || '-'}</td>
                      <td style={{...styles.td, ...styles.countCell}}>
                        <span style={{
                          ...styles.badge,
                          ...(empleadosCount > 0 ? styles.badgeWarning : styles.badgeInfo)
                        }}>
                          <Users size={12} />
                          {empleadosCount}
                        </span>
                      </td>
                      <td style={{...styles.td, ...styles.actionsCell}}>
                        <div style={styles.actionButtonsSmall}>
                          <button
                            onClick={() => {
                              setCargoForm({ nombre: cargo.nombre, descripcion: cargo.descripcion || '' });
                              setEditingId(cargo.id_cargo);
                              setShowCargoForm(true);
                            }}
                            style={styles.btnEdit}
                            title="Editar cargo"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCargo(cargo.id_cargo)}
                            style={styles.btnDelete}
                            title="Eliminar cargo"
                            disabled={empleadosCount > 0}
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
            {filteredCargos.length === 0 && (
              <div style={styles.emptyState}>
                <p>No se encontraron cargos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agregar estilos globales */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: #7a3b06 !important;
        }
        
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-edit:hover, .btn-delete:hover {
          opacity: 0.8;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }
          .action-buttons {
            flex-direction: column;
          }
          .btn {
            justify-content: center;
          }
          .form-actions {
            flex-direction: column;
          }
          .modal {
            margin: 20px;
          }
        }
      `}</style>
    </div>
  );
}