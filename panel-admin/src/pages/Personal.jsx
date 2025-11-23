import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  User, 
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  IdCard,
  Briefcase,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Loader,
  Users,
  Eye
} from "lucide-react";

export default function Personal() {
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [sueldos, setSueldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editingCi, setEditingCi] = useState(null);
  const [viewMode, setViewMode] = useState("lista");
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

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

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("todos");
  const [filtroRol, setFiltroRol] = useState("todos");

  useEffect(() => {
    cargarDatos();
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

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [empleadosRes, rolesRes, cargosRes, sueldosRes] = await Promise.all([
        supabase.from('empleados').select(`
          *,
          roles (nombre, descripcion),
          cargos (nombre, descripcion)
        `).order('ci'),
        supabase.from('roles').select('*').order('id_rol'),
        supabase.from('cargos').select('*').order('id_cargo'),
        supabase.from('sueldos').select('*').order('id_sueldo')
      ]);

      if (empleadosRes.error) throw empleadosRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (cargosRes.error) throw cargosRes.error;
      if (sueldosRes.error) throw sueldosRes.error;

      setEmpleados(empleadosRes.data || []);
      setRoles(rolesRes.data || []);
      setCargos(cargosRes.data || []);
      setSueldos(sueldosRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validateEmpleado = (empleado) => {
    if (!empleado.ci.trim()) throw new Error("El CI es requerido");
    if (empleado.ci.length < 5) throw new Error("El CI debe tener al menos 5 caracteres");
    if (!empleado.nombre.trim()) throw new Error("El nombre es requerido");
    if (!empleado.pat.trim()) throw new Error("El apellido paterno es requerido");
    if (!empleado.fecha_nac) throw new Error("La fecha de nacimiento es requerida");
    
    // Validar fecha (debe ser menor a la fecha actual)
    const fechaNac = new Date(empleado.fecha_nac);
    const hoy = new Date();
    if (fechaNac >= hoy) throw new Error("La fecha de nacimiento debe ser anterior a hoy");
    
    // Validar edad mínima (18 años)
    const edadMinima = new Date();
    edadMinima.setFullYear(edadMinima.getFullYear() - 18);
    if (fechaNac > edadMinima) throw new Error("El empleado debe ser mayor de 18 años");

    if (!empleado.id_rol) throw new Error("Debe seleccionar un rol");
    if (!empleado.id_cargo) throw new Error("Debe seleccionar un cargo");
    
    if (empleado.email && !/\S+@\S+\.\S+/.test(empleado.email)) {
      throw new Error("El email no es válido");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateEmpleado(form);
      
      if (editingCi) {
        const { error } = await supabase
          .from('empleados')
          .update(form)
          .eq('ci', editingCi);
        if (error) throw error;
        showMessage("Empleado actualizado exitosamente", "success");
      } else {
        // Verificar si el CI ya existe
        const { data: existe } = await supabase
          .from('empleados')
          .select('ci')
          .eq('ci', form.ci)
          .single();

        if (existe) throw new Error("Ya existe un empleado con este CI");

        const { error } = await supabase
          .from('empleados')
          .insert([form]);
        if (error) throw error;
        showMessage("Empleado creado exitosamente", "success");
      }

      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const editarEmpleado = (empleado) => {
    setForm({
      ci: empleado.ci,
      nombre: empleado.nombre,
      pat: empleado.pat,
      mat: empleado.mat || '',
      fecha_nac: empleado.fecha_nac,
      id_rol: empleado.id_rol,
      id_cargo: empleado.id_cargo,
      email: empleado.email || '',
      password: empleado.password || ''
    });
    setEditingCi(empleado.ci);
    setShowForm(true);
  };

  const verDetalleEmpleado = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setViewMode("detalle");
  };

  const eliminarEmpleado = async (ci) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        const { error } = await supabase
          .from('empleados')
          .delete()
          .eq('ci', ci);
        if (error) throw error;
        showMessage("Empleado eliminado exitosamente", "success");
        cargarDatos();
      } catch (error) {
        showMessage(`Error eliminando empleado: ${error.message}`);
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
  };

  // Filtros y cálculos
  const filteredEmpleados = empleados.filter(empleado => {
    const matchesSearch = 
      empleado.ci.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.pat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (empleado.mat && empleado.mat.toLowerCase().includes(searchTerm.toLowerCase())) ||
      empleado.roles?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.cargos?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCargo = filtroCargo === "todos" || empleado.id_cargo.toString() === filtroCargo;
    const matchesRol = filtroRol === "todos" || empleado.id_rol.toString() === filtroRol;

    return matchesSearch && matchesCargo && matchesRol;
  });

  // Obtener sueldo del cargo
  const getSueldoCargo = (idCargo) => {
    const sueldo = sueldos.find(s => s.id_cargo === idCargo);
    return sueldo ? sueldo.monto : 0;
  };

  // Calcular edad
  const calcularEdad = (fechaNac) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={32} className="spinner" />
        <p>Cargando datos del personal...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="page-header">
        <h1>Gestión de Personal</h1>
        <p>Administra la información de los empleados</p>
      </header>

      {/* Alertas */}
      {error && (
        <div className="alert error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert success">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Vista de Detalle */}
      {viewMode === "detalle" && empleadoSeleccionado && (
        <div className="detalle-empleado">
          <div className="detalle-header">
            <button 
              onClick={() => setViewMode("lista")}
              className="btn btn-secondary"
            >
              ← Volver a la lista
            </button>
            <h2>Detalle del Empleado</h2>
          </div>
          
          <div className="detalle-content">
            <div className="detalle-card">
              <div className="detalle-info">
                <div className="info-group">
                  <IdCard size={20} />
                  <div>
                    <label>CI</label>
                    <span>{empleadoSeleccionado.ci}</span>
                  </div>
                </div>
                <div className="info-group">
                  <User size={20} />
                  <div>
                    <label>Nombre Completo</label>
                    <span>{empleadoSeleccionado.nombre} {empleadoSeleccionado.pat} {empleadoSeleccionado.mat}</span>
                  </div>
                </div>
                <div className="info-group">
                  <Calendar size={20} />
                  <div>
                    <label>Fecha de Nacimiento</label>
                    <span>
                      {new Date(empleadoSeleccionado.fecha_nac).toLocaleDateString()} 
                      ({calcularEdad(empleadoSeleccionado.fecha_nac)} años)
                    </span>
                  </div>
                </div>
                <div className="info-group">
                  <Briefcase size={20} />
                  <div>
                    <label>Cargo</label>
                    <span>{empleadoSeleccionado.cargos?.nombre || 'N/A'}</span>
                  </div>
                </div>
                <div className="info-group">
                  <Shield size={20} />
                  <div>
                    <label>Rol</label>
                    <span>{empleadoSeleccionado.roles?.nombre || 'N/A'}</span>
                  </div>
                </div>
                {empleadoSeleccionado.email && (
                  <div className="info-group">
                    <Mail size={20} />
                    <div>
                      <label>Email</label>
                      <span>{empleadoSeleccionado.email}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="detalle-sueldo">
                <h3>Información Salarial</h3>
                <div className="sueldo-info">
                  <DollarSign size={24} />
                  <div>
                    <span className="sueldo-monto">
                      {new Intl.NumberFormat('es-BO', { 
                        style: 'currency', 
                        currency: 'BOB' 
                      }).format(getSueldoCargo(empleadoSeleccionado.id_cargo))}
                    </span>
                    <span className="sueldo-label">Sueldo asignado al cargo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Lista */}
      {viewMode === "lista" && (
        <>
          {/* Barra de búsqueda y filtros */}
          <div className="search-filter-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por CI, nombre, apellido, cargo o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select 
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos los cargos</option>
                {cargos.map(cargo => (
                  <option key={cargo.id_cargo} value={cargo.id_cargo}>
                    {cargo.nombre}
                  </option>
                ))}
              </select>
              <select 
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos los roles</option>
                {roles.map(rol => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{filteredEmpleados.length}</div>
                <div className="stat-label">Total Empleados</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Briefcase size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {[...new Set(filteredEmpleados.map(e => e.id_cargo))].length}
                </div>
                <div className="stat-label">Cargos Diferentes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Shield size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {[...new Set(filteredEmpleados.map(e => e.id_rol))].length}
                </div>
                <div className="stat-label">Roles Diferentes</div>
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="action-buttons">
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
              <Plus size={16} />
              Nuevo Empleado
            </button>
          </div>

          {/* Formulario modal */}
          {showForm && (
            <div className="modal-overlay">
              <div className="modal large">
                <h3>{editingCi ? "Editar Empleado" : "Nuevo Empleado"}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>CI *</label>
                      <input
                        type="text"
                        value={form.ci}
                        onChange={(e) => setForm({...form, ci: e.target.value})}
                        required
                        disabled={!!editingCi}
                        placeholder="Número de carnet"
                        maxLength={20}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha Nacimiento *</label>
                      <input
                        type="date"
                        value={form.fecha_nac}
                        onChange={(e) => setForm({...form, fecha_nac: e.target.value})}
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => setForm({...form, nombre: e.target.value})}
                        required
                        placeholder="Nombres"
                        maxLength={50}
                      />
                    </div>
                    <div className="form-group">
                      <label>Apellido Paterno *</label>
                      <input
                        type="text"
                        value={form.pat}
                        onChange={(e) => setForm({...form, pat: e.target.value})}
                        required
                        placeholder="Apellido paterno"
                        maxLength={30}
                      />
                    </div>
                    <div className="form-group">
                      <label>Apellido Materno</label>
                      <input
                        type="text"
                        value={form.mat}
                        onChange={(e) => setForm({...form, mat: e.target.value})}
                        placeholder="Apellido materno"
                        maxLength={30}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Cargo *</label>
                      <select
                        value={form.id_cargo}
                        onChange={(e) => setForm({...form, id_cargo: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar cargo</option>
                        {cargos.map(cargo => (
                          <option key={cargo.id_cargo} value={cargo.id_cargo}>
                            {cargo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        value={form.id_rol}
                        onChange={(e) => setForm({...form, id_rol: e.target.value})}
                        required
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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        placeholder="correo@ejemplo.com"
                        maxLength={100}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        placeholder="Contraseña del sistema"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">
                      <Save size={16} />
                      {editingCi ? "Actualizar" : "Guardar"}
                    </button>
                    <button type="button" onClick={resetForm} className="btn btn-cancel">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tabla de empleados */}
          <div className="table-card">
            <div className="table-header">
              <Users size={20} />
              <h2>Personal ({filteredEmpleados.length})</h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>CI</th>
                    <th>Nombre Completo</th>
                    <th>Edad</th>
                    <th>Cargo</th>
                    <th>Rol</th>
                    <th>Sueldo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmpleados.map(empleado => (
                    <tr key={empleado.ci}>
                      <td className="id-cell">{empleado.ci}</td>
                      <td className="name-cell">
                        <strong>{empleado.nombre}</strong><br/>
                        <small>{empleado.pat} {empleado.mat}</small>
                      </td>
                      <td className="age-cell">
                        {calcularEdad(empleado.fecha_nac)} años
                      </td>
                      <td className="cargo-cell">{empleado.cargos?.nombre || 'N/A'}</td>
                      <td className="rol-cell">{empleado.roles?.nombre || 'N/A'}</td>
                      <td className="sueldo-cell">
                        {new Intl.NumberFormat('es-BO', { 
                          style: 'currency', 
                          currency: 'BOB' 
                        }).format(getSueldoCargo(empleado.id_cargo))}
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons-small">
                          <button
                            onClick={() => verDetalleEmpleado(empleado)}
                            className="btn-view"
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => editarEmpleado(empleado)}
                            className="btn-edit"
                            title="Editar empleado"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => eliminarEmpleado(empleado.ci)}
                            className="btn-delete"
                            title="Eliminar empleado"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmpleados.length === 0 && (
                <div className="empty-state">
                  <p>No se encontraron empleados</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          font-size: 28px;
          color: #7a3b06;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .page-header p {
          color: #6d4611;
          font-size: 14px;
          opacity: 0.9;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #7a3b06;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert.error {
          background-color: #fee;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .alert.success {
          background-color: #f0fff4;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
        }

        /* Vista de Detalle */
        .detalle-empleado {
          background: white;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          overflow: hidden;
        }

        .detalle-header {
          padding: 20px;
          border-bottom: 1px solid #e9d8b5;
          background-color: #f8f5ee;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .detalle-header h2 {
          color: #7a3b06;
          margin: 0;
        }

        .detalle-content {
          padding: 30px;
        }

        .detalle-card {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        .detalle-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-group {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 15px;
          background: #f8f5ee;
          border-radius: 8px;
        }

        .info-group svg {
          color: #7a3b06;
          margin-top: 2px;
        }

        .info-group label {
          display: block;
          font-size: 12px;
          color: #6d4611;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .info-group span {
          display: block;
          font-weight: 500;
          color: #7a3b06;
        }

        .detalle-sueldo {
          background: #e8f5e8;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #c3e6cb;
        }

        .detalle-sueldo h3 {
          color: #155724;
          margin-bottom: 15px;
          font-size: 16px;
        }

        .sueldo-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .sueldo-info svg {
          color: #28a745;
        }

        .sueldo-monto {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #155724;
        }

        .sueldo-label {
          font-size: 12px;
          color: #6d4611;
          opacity: 0.8;
        }

        /* Barra de búsqueda y filtros */
        .search-filter-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6d4611;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
        }

        .filter-group {
          display: flex;
          gap: 12px;
        }

        .filter-select {
          padding: 12px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
          min-width: 180px;
        }

        /* Estadísticas */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          background: #f8f5ee;
          padding: 12px;
          border-radius: 8px;
          color: #7a3b06;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #7a3b06;
        }

        .stat-label {
          font-size: 12px;
          color: #6d4611;
          opacity: 0.8;
        }

        /* Botones y formularios (mantener estilos similares a los anteriores) */
        .action-buttons {
          margin-bottom: 24px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #7a3b06;
          color: white;
        }

        .btn-secondary {
          background-color: #6d4611;
          color: white;
        }

        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .btn-cancel {
          background-color: #6c757d;
          color: white;
        }

        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal.large {
          max-width: 800px;
        }

        .modal h3 {
          color: #7a3b06;
          margin-bottom: 20px;
          font-size: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #6d4611;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #7a3b06;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        /* Tabla */
        .table-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          overflow: hidden;
        }

        .table-header {
          padding: 20px;
          border-bottom: 1px solid #e9d8b5;
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #f8f5ee;
        }

        .table-header h2 {
          color: #7a3b06;
          margin: 0;
          font-size: 18px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        th {
          padding: 12px;
          text-align: left;
          border: 1px solid #e9d8b5;
          color: #6d4611;
          font-weight: 600;
          background-color: #f8f5ee;
        }

        td {
          padding: 12px;
          border: 1px solid #e9d8b5;
          color: #6d4611;
        }

        .id-cell {
          font-weight: 600;
          color: #7a3b06;
        }

        .name-cell strong {
          display: block;
          color: #7a3b06;
        }

        .name-cell small {
          color: #6d4611;
          opacity: 0.8;
        }

        .age-cell, .cargo-cell, .rol-cell {
          font-weight: 500;
        }

        .sueldo-cell {
          font-weight: 600;
          color: #28a745;
        }

        .actions-cell {
          width: 120px;
        }

        .action-buttons-small {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .btn-view,
        .btn-edit,
        .btn-delete {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view {
          background-color: #17a2b8;
          color: white;
        }

        .btn-edit {
          background-color: #ffc107;
          color: #7a3b06;
        }

        .btn-delete {
          background-color: #dc3545;
          color: white;
        }

        .btn-view:hover,
        .btn-edit:hover,
        .btn-delete:hover {
          opacity: 0.8;
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #6d4611;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }
          .search-filter-bar {
            flex-direction: column;
          }
          .filter-group {
            flex-direction: column;
          }
          .filter-select {
            min-width: auto;
          }
          .detalle-card {
            grid-template-columns: 1fr;
          }
          .form-actions {
            flex-direction: column;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .modal {
            margin: 20px;
          }
          .modal.large {
            max-width: calc(100vw - 40px);
          }
        }
      `}</style>
    </div>
  );
}