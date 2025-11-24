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
  Eye,
  EyeOff,
  DollarSign
} from "lucide-react";

// Función para hashear contraseñas (usando SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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
  
  // Nuevos estados para la contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

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

  const [formErrors, setFormErrors] = useState({});
  const [checkingCi, setCheckingCi] = useState(false);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("todos");
  const [filtroRol, setFiltroRol] = useState("todos");

  // Datos predefinidos para cargos y roles
  const cargosPredefinidos = [
    { id_cargo: 1, nombre: 'Gerente', descripcion: 'Responsable de la gestión del establecimiento' },
    { id_cargo: 2, nombre: 'Mesero', descripcion: 'Atención al cliente y servicio de mesa' },
    { id_cargo: 3, nombre: 'Parrillero', descripcion: 'Preparación de alimentos a la parrilla' },
    { id_cargo: 4, nombre: 'Limpiador', descripcion: 'Limpieza y mantenimiento del local' },
    { id_cargo: 5, nombre: 'Cajero', descripcion: 'Manejo de caja y pagos' },
    { id_cargo: 6, nombre: 'Cocinero', descripcion: 'Preparación de alimentos' },
    { id_cargo: 7, nombre: 'Bartender', descripcion: 'Preparación de bebidas y cócteles' }
  ];

  const rolesPredefinidos = [
    { id_rol: 1, nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
    { id_rol: 2, nombre: 'Mesero', descripcion: 'Acceso a módulos de servicio' },
    { id_rol: 3, nombre: 'Cajero', descripcion: 'Acceso a módulos de venta y caja' },
    { id_rol: 4, nombre: 'Cocina', descripcion: 'Acceso a módulos de cocina' },
    { id_rol: 5, nombre: 'Usuario', descripcion: 'Acceso básico al sistema' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para validar fortaleza de contraseña
  const validatePasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const isValid = Object.values(checks).every(check => check === true);

    setPasswordStrength({
      isValid,
      checks
    });

    return isValid;
  };

  // Función para verificar si el CI ya existe
  const checkCiExists = async (ci) => {
    if (!ci || ci.length < 5) return false;
    
    try {
      setCheckingCi(true);
      const { data, error } = await supabase
        .from('empleados')
        .select('ci')
        .eq('ci', ci)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error verificando CI:', error);
        return false;
      }

      return !!data; // Retorna true si existe, false si no existe
    } catch (error) {
      console.error('Error verificando CI:', error);
      return false;
    } finally {
      setCheckingCi(false);
    }
  };

  // Validación mejorada del formulario
  const validateForm = async () => {
    const errors = {};
    
    // Validación de CI
    if (!form.ci.trim()) {
      errors.ci = "El CI es requerido";
    } else if (form.ci.length < 5) {
      errors.ci = "El CI debe tener al menos 5 caracteres";
    } else if (!/^\d+$/.test(form.ci)) {
      errors.ci = "El CI debe contener solo números";
    } else if (form.ci.length > 15) {
      errors.ci = "El CI no puede tener más de 15 caracteres";
    } else if (!editingCi) {
      // Solo verificar existencia si no estamos editando
      const ciExists = await checkCiExists(form.ci);
      if (ciExists) {
        errors.ci = "Ya existe un empleado con este CI";
      }
    }

    // Validación de nombre
    if (!form.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    } else if (form.nombre.length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (form.nombre.length > 50) {
      errors.nombre = "El nombre no puede tener más de 50 caracteres";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.nombre)) {
      errors.nombre = "El nombre solo puede contener letras y espacios";
    }

    // Validación de apellido paterno
    if (!form.pat.trim()) {
      errors.pat = "El apellido paterno es requerido";
    } else if (form.pat.length < 2) {
      errors.pat = "El apellido paterno debe tener al menos 2 caracteres";
    } else if (form.pat.length > 30) {
      errors.pat = "El apellido paterno no puede tener más de 30 caracteres";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(form.pat)) {
      errors.pat = "El apellido paterno solo puede contener letras";
    }

    // Validación de apellido materno
    if (form.mat && form.mat.trim()) {
      if (form.mat.length < 2) {
        errors.mat = "El apellido materno debe tener al menos 2 caracteres";
      } else if (form.mat.length > 30) {
        errors.mat = "El apellido materno no puede tener más de 30 caracteres";
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(form.mat)) {
        errors.mat = "El apellido materno solo puede contener letras";
      }
    }

    // Validación de fecha de nacimiento CORREGIDA
    if (!form.fecha_nac) {
      errors.fecha_nac = "La fecha de nacimiento es requerida";
    } else {
      const fechaNac = new Date(form.fecha_nac);
      const hoy = new Date();
      
      // Calcular edad exacta
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mes = hoy.getMonth() - fechaNac.getMonth();
      
      // Ajustar edad si aún no ha pasado el mes de cumpleaños
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
      }
      
      if (fechaNac >= hoy) {
        errors.fecha_nac = "La fecha de nacimiento debe ser anterior a hoy";
      } else if (edad < 14) {
        errors.fecha_nac = "El empleado debe tener al menos 14 años";
      } else if (edad > 100) {
        errors.fecha_nac = "La edad no puede ser mayor a 100 años";
      }
    }

    // Validación de cargo
    if (!form.id_cargo) {
      errors.id_cargo = "Debe seleccionar un cargo";
    }

    // Validación de rol
    if (!form.id_rol) {
      errors.id_rol = "Debe seleccionar un rol";
    }

    // Validación de email
    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errors.email = "El email no es válido";
      } else if (form.email.length > 100) {
        errors.email = "El email no puede tener más de 100 caracteres";
      }
    }

    // Validación de contraseña
    if (!editingCi) {
      if (!form.password) {
        errors.password = "La contraseña es requerida";
      } else if (!validatePasswordStrength(form.password)) {
        errors.password = "La contraseña no cumple con los requisitos de seguridad";
      }
    } else if (form.password && form.password !== '') {
      if (!validatePasswordStrength(form.password)) {
        errors.password = "La nueva contraseña no cumple con los requisitos de seguridad";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
      
      // Cargar empleados y sueldos desde Supabase
      const [empleadosRes, sueldosRes] = await Promise.all([
        supabase.from('empleados').select(`
          *,
          roles (nombre, descripcion),
          cargos (nombre, descripcion)
        `).order('ci'),
        supabase.from('sueldos').select('*').order('id_sueldo')
      ]);

      if (empleadosRes.error) throw empleadosRes.error;
      if (sueldosRes.error) throw sueldosRes.error;

      // Usar datos predefinidos para cargos y roles
      setCargos(cargosPredefinidos);
      setRoles(rolesPredefinidos);
      
      setEmpleados(empleadosRes.data || []);
      setSueldos(sueldosRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      showMessage("Por favor, corrige los errores en el formulario");
      return;
    }

    try {
      // Preparar datos para enviar
      const datosAEnviar = { ...form };
      
      // Hashear la contraseña si se proporciona una nueva
      if (datosAEnviar.password && datosAEnviar.password !== '') {
        datosAEnviar.password = await hashPassword(datosAEnviar.password);
      } else if (editingCi) {
        // Si estamos editando y no se cambió la contraseña, no enviarla
        delete datosAEnviar.password;
      }
      
      if (editingCi) {
        const { error } = await supabase
          .from('empleados')
          .update(datosAEnviar)
          .eq('ci', editingCi);
        if (error) throw error;
        showMessage("Empleado actualizado exitosamente", "success");
      } else {
        // Verificar nuevamente si el CI ya existe (doble verificación)
        const ciExists = await checkCiExists(form.ci);
        if (ciExists) {
          throw new Error("Ya existe un empleado con este CI");
        }

        const { error } = await supabase
          .from('empleados')
          .insert([datosAEnviar]);
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
      password: '' // Limpiar contraseña al editar por seguridad
    });
    setEditingCi(empleado.ci);
    setShowForm(true);
    // Resetear validación de contraseña
    setPasswordStrength({
      isValid: false,
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      }
    });
    setFormErrors({});
  };

  // Función para manejar cambio de contraseña
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setForm({...form, password: newPassword});
    validatePasswordStrength(newPassword);
    
    // Limpiar error de contraseña si se está escribiendo
    if (formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Función para manejar cambios en los campos
  const handleInputChange = async (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Verificar CI único en tiempo real (solo para nuevo empleado)
    if (field === 'ci' && !editingCi && value.length >= 5) {
      const ciExists = await checkCiExists(value);
      if (ciExists) {
        setFormErrors(prev => ({ 
          ...prev, 
          ci: "Ya existe un empleado con este CI" 
        }));
      }
    }
  };

  const verDetalleEmpleado = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setViewMode("detalle");
  };

  const eliminarEmpleado = async (ci) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) {
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
    setShowPassword(false);
    setFormErrors({});
    setPasswordStrength({
      isValid: false,
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      }
    });
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

    const matchesCargo = filtroCargo === "todos" || empleado.id_cargo?.toString() === filtroCargo;
    const matchesRol = filtroRol === "todos" || empleado.id_rol?.toString() === filtroRol;

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
                    <span>{empleadoSeleccionado.cargos?.nombre || cargosPredefinidos.find(c => c.id_cargo === empleadoSeleccionado.id_cargo)?.nombre || 'N/A'}</span>
                  </div>
                </div>
                <div className="info-group">
                  <Shield size={20} />
                  <div>
                    <label>Rol</label>
                    <span>{empleadoSeleccionado.roles?.nombre || rolesPredefinidos.find(r => r.id_rol === empleadoSeleccionado.id_rol)?.nombre || 'N/A'}</span>
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
              <div className="filter-item">
                <label className="filter-label">Cargo:</label>
                <select 
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(e.target.value)}
                  className="filter-select"
                >
                  <option value="todos">Todos los cargos</option>
                  {cargosPredefinidos.map(cargo => (
                    <option key={cargo.id_cargo} value={cargo.id_cargo}>
                      {cargo.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-item">
                <label className="filter-label">Rol:</label>
                <select 
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  className="filter-select"
                >
                  <option value="todos">Todos los roles</option>
                  {rolesPredefinidos.map(rol => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => {
                  setFiltroCargo("todos");
                  setFiltroRol("todos");
                  setSearchTerm("");
                }}
                className="btn btn-outline btn-small"
              >
                Limpiar Filtros
              </button>
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
            <div className="stat-card">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {new Intl.NumberFormat('es-BO', { 
                    style: 'currency', 
                    currency: 'BOB' 
                  }).format(
                    filteredEmpleados.reduce((sum, emp) => sum + getSueldoCargo(emp.id_cargo), 0)
                  )}
                </div>
                <div className="stat-label">Total en Sueldos</div>
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
                <div className="modal-header">
                  <h3>{editingCi ? "Editar Empleado" : "Nuevo Empleado"}</h3>
                  <button onClick={resetForm} className="btn-close">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="form-container">
                  <div className="form-section">
                    <h4>Información Personal</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">
                          CI *
                          {formErrors.ci && <span className="error-indicator">!</span>}
                          {checkingCi && <span className="checking-indicator">✓</span>}
                        </label>
                        <input
                          type="text"
                          value={form.ci}
                          onChange={(e) => handleInputChange('ci', e.target.value)}
                          className={`form-input ${formErrors.ci ? 'error' : ''} ${checkingCi ? 'checking' : ''}`}
                          required
                          disabled={!!editingCi}
                          placeholder="Número de carnet"
                          maxLength={15}
                        />
                        {formErrors.ci && <span className="error-message">{formErrors.ci}</span>}
                        {!formErrors.ci && form.ci.length >= 5 && !checkingCi && (
                          <span className="success-message">✓ CI disponible</span>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Fecha Nacimiento *
                          {formErrors.fecha_nac && <span className="error-indicator">!</span>}
                        </label>
                        <input
                          type="date"
                          value={form.fecha_nac}
                          onChange={(e) => handleInputChange('fecha_nac', e.target.value)}
                          className={`form-input ${formErrors.fecha_nac ? 'error' : ''}`}
                          required
                          max={new Date().toISOString().split('T')[0]}
                        />
                        {formErrors.fecha_nac && <span className="error-message">{formErrors.fecha_nac}</span>}
                        {form.fecha_nac && !formErrors.fecha_nac && (
                          <span className="success-message">
                            ✓ Edad: {calcularEdad(form.fecha_nac)} años
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">
                          Nombre *
                          {formErrors.nombre && <span className="error-indicator">!</span>}
                        </label>
                        <input
                          type="text"
                          value={form.nombre}
                          onChange={(e) => handleInputChange('nombre', e.target.value)}
                          className={`form-input ${formErrors.nombre ? 'error' : ''}`}
                          required
                          placeholder="Nombres"
                          maxLength={50}
                        />
                        {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Apellido Paterno *
                          {formErrors.pat && <span className="error-indicator">!</span>}
                        </label>
                        <input
                          type="text"
                          value={form.pat}
                          onChange={(e) => handleInputChange('pat', e.target.value)}
                          className={`form-input ${formErrors.pat ? 'error' : ''}`}
                          required
                          placeholder="Apellido paterno"
                          maxLength={30}
                        />
                        {formErrors.pat && <span className="error-message">{formErrors.pat}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Apellido Materno
                          {formErrors.mat && <span className="error-indicator">!</span>}
                        </label>
                        <input
                          type="text"
                          value={form.mat}
                          onChange={(e) => handleInputChange('mat', e.target.value)}
                          className={`form-input ${formErrors.mat ? 'error' : ''}`}
                          placeholder="Apellido materno"
                          maxLength={30}
                        />
                        {formErrors.mat && <span className="error-message">{formErrors.mat}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Información Laboral</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">
                          Cargo *
                          {formErrors.id_cargo && <span className="error-indicator">!</span>}
                        </label>
                        <select
                          value={form.id_cargo}
                          onChange={(e) => handleInputChange('id_cargo', e.target.value)}
                          className={`form-input ${formErrors.id_cargo ? 'error' : ''}`}
                          required
                        >
                          <option value="">Seleccionar cargo</option>
                          {cargosPredefinidos.map(cargo => (
                            <option key={cargo.id_cargo} value={cargo.id_cargo}>
                              {cargo.nombre} - {cargo.descripcion}
                            </option>
                          ))}
                        </select>
                        {formErrors.id_cargo && <span className="error-message">{formErrors.id_cargo}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Rol *
                          {formErrors.id_rol && <span className="error-indicator">!</span>}
                        </label>
                        <select
                          value={form.id_rol}
                          onChange={(e) => handleInputChange('id_rol', e.target.value)}
                          className={`form-input ${formErrors.id_rol ? 'error' : ''}`}
                          required
                        >
                          <option value="">Seleccionar rol</option>
                          {rolesPredefinidos.map(rol => (
                            <option key={rol.id_rol} value={rol.id_rol}>
                              {rol.nombre} - {rol.descripcion}
                            </option>
                          ))}
                        </select>
                        {formErrors.id_rol && <span className="error-message">{formErrors.id_rol}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Información de Acceso</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">
                          Email
                          {formErrors.email && <span className="error-indicator">!</span>}
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`form-input ${formErrors.email ? 'error' : ''}`}
                          placeholder="correo@ejemplo.com"
                          maxLength={100}
                        />
                        {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Contraseña {!editingCi && "*"}
                          {formErrors.password && <span className="error-indicator">!</span>}
                        </label>
                        <div className="password-input-container">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={handlePasswordChange}
                            className={`form-input ${formErrors.password ? 'error' : ''}`}
                            placeholder={editingCi ? "Dejar en blanco para no cambiar" : "Contraseña segura"}
                            maxLength={50}
                            required={!editingCi}
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                        
                        {/* Indicador de fortaleza de contraseña */}
                        {form.password && (
                          <div className="password-strength">
                            <div className="strength-header">
                              <span>Requisitos de contraseña:</span>
                              <span className={`strength-status ${passwordStrength.isValid ? 'valid' : 'invalid'}`}>
                                {passwordStrength.isValid ? '✓ Segura' : '✗ Débil'}
                              </span>
                            </div>
                            <div className="strength-checks">
                              <div className={`check-item ${passwordStrength.checks.length ? 'valid' : 'invalid'}`}>
                                {passwordStrength.checks.length ? '✓' : '✗'} Mínimo 8 caracteres
                              </div>
                              <div className={`check-item ${passwordStrength.checks.uppercase ? 'valid' : 'invalid'}`}>
                                {passwordStrength.checks.uppercase ? '✓' : '✗'} Una letra mayúscula
                              </div>
                              <div className={`check-item ${passwordStrength.checks.lowercase ? 'valid' : 'invalid'}`}>
                                {passwordStrength.checks.lowercase ? '✓' : '✗'} Una letra minúscula
                              </div>
                              <div className={`check-item ${passwordStrength.checks.number ? 'valid' : 'invalid'}`}>
                                {passwordStrength.checks.number ? '✓' : '✗'} Un número
                              </div>
                              <div className={`check-item ${passwordStrength.checks.special ? 'valid' : 'invalid'}`}>
                                {passwordStrength.checks.special ? '✓' : '✗'} Un carácter especial
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!editingCi && (
                          <small className="password-hint">
                            La contraseña debe cumplir con todos los requisitos de seguridad y será hasheada antes de guardarse
                          </small>
                        )}
                        {editingCi && (
                          <small className="password-hint">
                            Dejar en blanco para mantener la contraseña actual
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={!editingCi && form.password && !passwordStrength.isValid}
                    >
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
              <div className="table-actions">
                <span className="filter-indicator">
                  {filtroCargo !== "todos" && `Cargo: ${cargosPredefinidos.find(c => c.id_cargo.toString() === filtroCargo)?.nombre}`}
                  {filtroRol !== "todos" && ` | Rol: ${rolesPredefinidos.find(r => r.id_rol.toString() === filtroRol)?.nombre}`}
                </span>
              </div>
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
                      <td className="cargo-cell">
                        {empleado.cargos?.nombre || cargosPredefinidos.find(c => c.id_cargo === empleado.id_cargo)?.nombre || 'N/A'}
                      </td>
                      <td className="rol-cell">
                        {empleado.roles?.nombre || rolesPredefinidos.find(r => r.id_rol === empleado.id_rol)?.nombre || 'N/A'}
                      </td>
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
                  {(filtroCargo !== "todos" || filtroRol !== "todos" || searchTerm) && (
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        setFiltroCargo("todos");
                        setFiltroRol("todos");
                        setSearchTerm("");
                      }}
                    >
                      Limpiar filtros
                    </button>
                  )}
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
          align-items: end;
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
          align-items: end;
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-label {
          font-size: 12px;
          color: #6d4611;
          font-weight: 500;
        }

        .filter-select {
          padding: 10px 12px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          font-size: 14px;
          min-width: 180px;
          background: white;
        }

        .btn-small {
          padding: 8px 12px;
          font-size: 12px;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #7a3b06;
          color: #7a3b06;
        }

        .btn-outline:hover {
          background: #7a3b06;
          color: white;
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

        /* Botones y formularios */
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

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn:disabled:hover {
          opacity: 0.6;
          transform: none;
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
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal.large {
          max-width: 800px;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e9d8b5;
          display: flex;
          justify-content: between;
          align-items: center;
        }

        .modal-header h3 {
          color: #7a3b06;
          margin: 0;
          font-size: 20px;
        }

        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6d4611;
          padding: 5px;
        }

        .form-container {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-section h4 {
          color: #7a3b06;
          margin-bottom: 16px;
          font-size: 16px;
          border-bottom: 1px solid #e9d8b5;
          padding-bottom: 8px;
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

        .form-label {
          display: block;
          margin-bottom: 6px;
          color: #6d4611;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #7a3b06;
        }

        .form-input.error {
          border-color: #dc3545;
          background-color: #fff5f5;
        }

        .form-input.checking {
          border-color: #ffc107;
          background-color: #fffbf0;
        }

        .error-indicator {
          color: #dc3545;
          font-weight: bold;
        }

        .checking-indicator {
          color: #ffc107;
          font-weight: bold;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .success-message {
          color: #28a745;
          font-size: 12px;
          margin-top: 4px;
          display: block;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e9d8b5;
        }

        /* Nuevos estilos para la contraseña */
        .password-input-container {
          position: relative;
        }

        .password-input-container input {
          padding-right: 40px;
          width: 100%;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #6d4611;
          opacity: 0.7;
          padding: 4px;
        }

        .password-toggle:hover {
          opacity: 1;
        }

        .password-strength {
          margin-top: 10px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9d8b5;
        }

        .strength-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 500;
        }

        .strength-status.valid {
          color: #28a745;
          font-weight: 600;
        }

        .strength-status.invalid {
          color: #dc3545;
          font-weight: 600;
        }

        .strength-checks {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .check-item {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .check-item.valid {
          color: #28a745;
        }

        .check-item.invalid {
          color: #6c757d;
        }

        .password-hint {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          color: #6d4611;
          opacity: 0.7;
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
          justify-content: between;
        }

        .table-header h2 {
          color: #7a3b06;
          margin: 0;
          font-size: 18px;
        }

        .table-actions {
          margin-left: auto;
        }

        .filter-indicator {
          font-size: 12px;
          color: #6d4611;
          opacity: 0.7;
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

        .empty-state .btn {
          margin-top: 10px;
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
            align-items: stretch;
          }
          .filter-item {
            width: 100%;
          }
          .filter-select {
            min-width: auto;
            width: 100%;
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
          .table-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .table-actions {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}