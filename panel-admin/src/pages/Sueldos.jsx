// src/pages/Sueldos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  DollarSign, 
  Search,
  Briefcase,
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Loader,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from "lucide-react";

export default function Sueldos() {
  const [sueldos, setSueldos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [form, setForm] = useState({ 
    monto: '', 
    descripcion: '', 
    id_cargo: '' 
  });

  const [formErrors, setFormErrors] = useState({});

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("todos");

  useEffect(() => {
    cargarDatos();
  }, []);

  const showMessage = (message, type = "error") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(""), 6000);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [sueldosRes, cargosRes, empleadosRes] = await Promise.all([
        supabase.from('sueldos').select(`
          *,
          cargos (nombre, descripcion)
        `).order('id_sueldo'),
        supabase.from('cargos').select('*').order('id_cargo'),
        supabase.from('empleados').select('ci, nombre, pat, id_cargo')
      ]);

      if (sueldosRes.error) throw sueldosRes.error;
      if (cargosRes.error) throw cargosRes.error;
      if (empleadosRes.error) throw empleadosRes.error;

      setSueldos(sueldosRes.data || []);
      setCargos(cargosRes.data || []);
      setEmpleados(empleadosRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones mejoradas
  const validateForm = () => {
    const errors = {};

    // Validación de monto
    if (!form.monto || form.monto.trim() === '') {
      errors.monto = "El monto es obligatorio";
    } else {
      const monto = parseFloat(form.monto);
      if (isNaN(monto) || monto <= 0) {
        errors.monto = "El monto debe ser un número mayor a 0";
      } else if (monto < 1500) {
        errors.monto = "El monto mínimo es Bs 1,500";
      } else if (monto > 8000) {
        errors.monto = "El monto máximo es Bs 8,000";
      }
    }

    // Validación de cargo
    if (!form.id_cargo) {
      errors.id_cargo = "Debe seleccionar un cargo";
    } else {
      // Verificar si ya existe un sueldo para este cargo
      const sueldoExistente = sueldos.find(s => 
        s.id_cargo === parseInt(form.id_cargo) && 
        (!editingId || s.id_sueldo !== editingId)
      );
      if (sueldoExistente) {
        errors.id_cargo = `Ya existe un sueldo definido para el cargo: ${sueldoExistente.cargos?.nombre}`;
      }
    }

    // Validación de descripción
    if (form.descripcion && form.descripcion.length > 200) {
      errors.descripcion = "La descripción no puede exceder 200 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('guardar');
    
    try {
      if (!validateForm()) {
        showMessage("Por favor, corrige los errores en el formulario");
        setActionLoading(null);
        return;
      }
      
      const sueldoData = {
        monto: parseFloat(form.monto),
        descripcion: form.descripcion.trim() || null,
        id_cargo: parseInt(form.id_cargo)
      };

      if (editingId) {
        const { error } = await supabase
          .from('sueldos')
          .update(sueldoData)
          .eq('id_sueldo', editingId);
        if (error) throw error;
        showMessage("Sueldo actualizado exitosamente", "success");
      } else {
        const { error } = await supabase
          .from('sueldos')
          .insert([sueldoData]);
        if (error) throw error;
        showMessage("Sueldo creado exitosamente", "success");
      }

      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const editarSueldo = (sueldo) => {
    setForm({
      monto: sueldo.monto.toString(),
      descripcion: sueldo.descripcion || '',
      id_cargo: sueldo.id_cargo.toString()
    });
    setEditingId(sueldo.id_sueldo);
    setShowForm(true);
    setFormErrors({});
  };

  const eliminarSueldo = async (id) => {
    const sueldoAEliminar = sueldos.find(s => s.id_sueldo === id);
    if (!sueldoAEliminar) return;

    // Verificar si hay empleados con este cargo
    const empleadosConEsteCargo = empleados.filter(emp => emp.id_cargo === sueldoAEliminar.id_cargo);
    
    if (empleadosConEsteCargo.length > 0) {
      const empleadosNombres = empleadosConEsteCargo
        .slice(0, 3)
        .map(emp => `${emp.nombre} ${emp.pat}`)
        .join(', ');
      
      const mensajeAdicional = empleadosConEsteCargo.length > 3 
        ? ` y ${empleadosConEsteCargo.length - 3} más...` 
        : '';
      
      showMessage(
        `No se puede eliminar. ${empleadosConEsteCargo.length} empleado(s) tienen este cargo asignado: ${empleadosNombres}${mensajeAdicional}`
      );
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar el sueldo de ${sueldoAEliminar.cargos?.nombre}?`)) {
      setActionLoading(`delete-${id}`);
      try {
        const { error } = await supabase
          .from('sueldos')
          .delete()
          .eq('id_sueldo', id);
        if (error) throw error;
        showMessage("Sueldo eliminado exitosamente", "success");
        cargarDatos();
      } catch (error) {
        showMessage(`Error eliminando sueldo: ${error.message}`);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const resetForm = () => {
    setForm({ monto: '', descripcion: '', id_cargo: '' });
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const resetFiltros = () => {
    setSearchTerm("");
    setFiltroCargo("todos");
  };

  // Filtros y cálculos
  const filteredSueldos = sueldos.filter(sueldo => {
    const matchesSearch = 
      sueldo.cargos?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sueldo.descripcion && sueldo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sueldo.monto.toString().includes(searchTerm);

    const matchesCargo = filtroCargo === "todos" || sueldo.id_cargo.toString() === filtroCargo;

    return matchesSearch && matchesCargo;
  });

  // Estadísticas mejoradas
  const estadisticas = {
    totalSueldos: filteredSueldos.length,
    sueldoPromedio: filteredSueldos.length > 0 
      ? filteredSueldos.reduce((sum, s) => sum + s.monto, 0) / filteredSueldos.length 
      : 0,
    sueldoMaximo: filteredSueldos.length > 0 
      ? Math.max(...filteredSueldos.map(s => s.monto)) 
      : 0,
    sueldoMinimo: filteredSueldos.length > 0 
      ? Math.min(...filteredSueldos.map(s => s.monto)) 
      : 0,
    totalEmpleadosAfectados: filteredSueldos.reduce((total, sueldo) => {
      const empleadosCount = empleados.filter(emp => emp.id_cargo === sueldo.id_cargo).length;
      return total + empleadosCount;
    }, 0)
  };

  const ErrorMessage = ({ error }) => (
    error ? (
      <div className="error-message">
        <AlertCircle size={12} />
        <span>{error}</span>
      </div>
    ) : null
  );

  const SuccessMessage = ({ message }) => (
    message ? (
      <div className="success-message">
        <CheckCircle2 size={12} />
        <span>{message}</span>
      </div>
    ) : null
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={32} className="spinner" />
        <p>Cargando datos de sueldos...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-title">
            <DollarSign size={32} />
            <div>
              <h1>Gestión de Sueldos</h1>
              <p>Administra los sueldos por cargo del personal</p>
            </div>
          </div>
          <button 
            onClick={cargarDatos}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RotateCcw size={16} className={loading ? 'spinner' : ''} />
            Actualizar
          </button>
        </div>
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

      {/* Barra de búsqueda y filtros */}
      <div className="search-filter-bar">
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por cargo, descripción o monto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

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

          <button 
            onClick={resetFiltros}
            className="btn btn-outline"
          >
            <X size={16} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{estadisticas.totalSueldos}</div>
            <div className="stat-label">Sueldos Definidos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {new Intl.NumberFormat('es-BO', { 
                style: 'currency', 
                currency: 'BOB' 
              }).format(estadisticas.sueldoPromedio)}
            </div>
            <div className="stat-label">Promedio</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {new Intl.NumberFormat('es-BO', { 
                style: 'currency', 
                currency: 'BOB' 
              }).format(estadisticas.sueldoMaximo)}
            </div>
            <div className="stat-label">Máximo</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{estadisticas.totalEmpleadosAfectados}</div>
            <div className="stat-label">Empleados</div>
          </div>
        </div>
      </div>

      {/* Alertas importantes */}
      {sueldos.some(s => s.monto < 1500) && (
        <div className="alert warning">
          <AlertTriangle size={16} />
          <span>
            <strong>Advertencia:</strong> Hay sueldos por debajo del mínimo legal (Bs 1,500)
          </span>
        </div>
      )}

      {sueldos.some(s => s.monto > 8000) && (
        <div className="alert info">
          <TrendingUp size={16} />
          <span>
            <strong>Información:</strong> Hay sueldos que exceden el límite máximo recomendado (Bs 8,000)
          </span>
        </div>
      )}

      {/* Botón de acción */}
      <div className="action-buttons">
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
          <Plus size={16} />
          Nuevo Sueldo
        </button>
      </div>

      {/* Formulario modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {editingId ? (
                  <>
                    <Edit size={20} />
                    Editar Sueldo
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Nuevo Sueldo
                  </>
                )}
              </h3>
              <button onClick={resetForm} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-section">
                <h4>
                  <DollarSign size={16} />
                  Información del Sueldo
                </h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Monto (Bs) *
                      {formErrors.monto && <span className="error-indicator">!</span>}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1500"
                      max="8000"
                      value={form.monto}
                      onChange={(e) => setForm({...form, monto: e.target.value})}
                      className={`form-input ${formErrors.monto ? 'error' : ''}`}
                      required
                      placeholder="1500.00 - 8000.00"
                    />
                    <ErrorMessage error={formErrors.monto} />
                    {form.monto && !formErrors.monto && (
                      <SuccessMessage message={`✓ Rango válido: Bs 1,500 - Bs 8,000`} />
                    )}
                    <div className="input-hint">
                      Rango permitido: Bs 1,500 - Bs 8,000
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Cargo *
                      {formErrors.id_cargo && <span className="error-indicator">!</span>}
                    </label>
                    <select
                      value={form.id_cargo}
                      onChange={(e) => setForm({...form, id_cargo: e.target.value})}
                      className={`form-input ${formErrors.id_cargo ? 'error' : ''}`}
                      required
                    >
                      <option value="">Seleccionar cargo</option>
                      {cargos.map(cargo => (
                        <option key={cargo.id_cargo} value={cargo.id_cargo}>
                          {cargo.nombre}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage error={formErrors.id_cargo} />
                    {form.id_cargo && !formErrors.id_cargo && (
                      <SuccessMessage message="✓ Cargo disponible" />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Descripción
                    {formErrors.descripcion && <span className="error-indicator">!</span>}
                  </label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({...form, descripcion: e.target.value})}
                    className={`form-input ${formErrors.descripcion ? 'error' : ''}`}
                    placeholder="Descripción adicional del sueldo (opcional)..."
                    rows="3"
                    maxLength={200}
                  />
                  <div className="input-footer">
                    <span className="char-count">{form.descripcion?.length || 0}/200</span>
                    {formErrors.descripcion && (
                      <ErrorMessage error={formErrors.descripcion} />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={actionLoading === 'guardar'}
                >
                  {actionLoading === 'guardar' ? (
                    <>
                      <Loader size={16} className="spinner" />
                      {editingId ? "Actualizando..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId ? "Actualizar" : "Guardar"}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="btn btn-cancel"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de sueldos */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title">
            <DollarSign size={20} />
            <h2>Sueldos ({filteredSueldos.length})</h2>
          </div>
          <div className="table-actions">
            {(filtroCargo !== "todos" || searchTerm) && (
              <span className="filter-indicator">
                {filtroCargo !== "todos" && `Cargo: ${cargos.find(c => c.id_cargo.toString() === filtroCargo)?.nombre}`}
                {searchTerm && ` | Búsqueda: "${searchTerm}"`}
              </span>
            )}
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Monto</th>
                <th>Cargo</th>
                <th>Empleados</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSueldos.map(sueldo => {
                const empleadosCount = empleados.filter(emp => emp.id_cargo === sueldo.id_cargo).length;
                const estaEnRango = sueldo.monto >= 1500 && sueldo.monto <= 8000;
                
                return (
                  <tr key={sueldo.id_sueldo}>
                    <td className="id-cell">{sueldo.id_sueldo}</td>
                    <td className="amount-cell">
                      <div className="amount-content">
                        <strong>
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(sueldo.monto)}
                        </strong>
                        {!estaEnRango && (
                          <div className="amount-warning">
                            <AlertTriangle size={12} />
                            {sueldo.monto < 1500 ? 'Muy bajo' : 'Muy alto'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="name-cell">
                      <div className="cargo-info">
                        <span className="cargo-name">{sueldo.cargos?.nombre || 'N/A'}</span>
                        <span className="cargo-id">ID: {sueldo.id_cargo}</span>
                      </div>
                    </td>
                    <td className="count-cell">
                      <div className={`employee-count ${empleadosCount > 0 ? 'has-employees' : 'no-employees'}`}>
                        <Users size={14} />
                        <span>{empleadosCount}</span>
                        {empleadosCount > 0 && (
                          <div className="employee-tooltip">
                            {empleadosCount} empleado(s) asignado(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="desc-cell">
                      {sueldo.descripcion ? (
                        <div className="description-text" title={sueldo.descripcion}>
                          {sueldo.descripcion}
                        </div>
                      ) : (
                        <span className="no-description">-</span>
                      )}
                    </td>
                    <td className="status-cell">
                      <div className={`status-badge ${estaEnRango ? 'valid' : 'invalid'}`}>
                        {estaEnRango ? (
                          <>
                            <CheckCircle2 size={12} />
                            Válido
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} />
                            {sueldo.monto < 1500 ? 'Bajo' : 'Alto'}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons-small">
                        <button
                          onClick={() => editarSueldo(sueldo)}
                          className="btn-edit"
                          title="Editar sueldo"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => eliminarSueldo(sueldo.id_sueldo)}
                          className="btn-delete"
                          disabled={actionLoading === `delete-${sueldo.id_sueldo}` || empleadosCount > 0}
                          title={
                            empleadosCount > 0 
                              ? `No se puede eliminar - ${empleadosCount} empleado(s) asignado(s)` 
                              : "Eliminar sueldo"
                          }
                        >
                          {actionLoading === `delete-${sueldo.id_sueldo}` ? (
                            <Loader size={14} className="spinner" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSueldos.length === 0 && (
            <div className="empty-state">
              <DollarSign size={48} />
              <p>No se encontraron sueldos</p>
              {(filtroCargo !== "todos" || searchTerm) && (
                <button 
                  onClick={resetFiltros}
                  className="btn btn-outline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-title {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .header-title h1 {
          font-size: 28px;
          color: #7a3b06;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .header-title p {
          color: #6d4611;
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
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

        .alert.warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }

        .alert.info {
          background-color: #e3f2fd;
          border: 1px solid #bbdefb;
          color: #1976d2;
        }

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
        }

        .search-filter-bar {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          margin-bottom: 24px;
        }

        .search-section {
          display: flex;
          gap: 12px;
          align-items: center;
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

        .filter-select {
          padding: 12px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
          min-width: 200px;
          background: white;
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

        .btn-outline {
          background: transparent;
          border: 1px solid #7a3b06;
          color: #7a3b06;
        }

        .btn-outline:hover {
          background: #7a3b06;
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
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          padding: 12px;
          border-radius: 8px;
        }

        .stat-icon.primary {
          background: #f8f5ee;
          color: #7a3b06;
        }

        .stat-icon.success {
          background: #e8f5e8;
          color: #28a745;
        }

        .stat-icon.warning {
          background: #fff3cd;
          color: #856404;
        }

        .stat-icon.info {
          background: #e3f2fd;
          color: #1976d2;
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

        .action-buttons {
          margin-bottom: 24px;
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
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e9d8b5;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          color: #7a3b06;
          margin: 0;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
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
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
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

        .error-indicator {
          color: #dc3545;
          font-weight: bold;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
          color: #dc3545;
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
          color: #28a745;
        }

        .input-hint {
          font-size: 12px;
          color: #6d4611;
          opacity: 0.7;
          margin-top: 4px;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }

        .char-count {
          font-size: 12px;
          color: #6d4611;
          opacity: 0.7;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e9d8b5;
        }

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
          justify-content: space-between;
          background-color: #f8f5ee;
        }

        .table-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .table-title h2 {
          color: #7a3b06;
          margin: 0;
          font-size: 18px;
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

        .amount-cell {
          font-weight: 600;
        }

        .amount-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .amount-warning {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #dc3545;
          font-weight: 500;
        }

        .name-cell {
          font-weight: 500;
        }

        .cargo-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cargo-name {
          font-weight: 600;
          color: #7a3b06;
        }

        .cargo-id {
          font-size: 11px;
          color: #6d4611;
          opacity: 0.7;
        }

        .count-cell {
          text-align: center;
        }

        .employee-count {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          position: relative;
        }

        .employee-count.has-employees {
          background: #e8f5e8;
          color: #28a745;
        }

        .employee-count.no-employees {
          background: #f8f9fa;
          color: #6c757d;
        }

        .employee-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .employee-count:hover .employee-tooltip {
          opacity: 1;
        }

        .desc-cell {
          max-width: 200px;
        }

        .description-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .no-description {
          color: #6c757d;
          font-style: italic;
        }

        .status-cell {
          text-align: center;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.valid {
          background: #e8f5e8;
          color: #28a745;
        }

        .status-badge.invalid {
          background: #fff3cd;
          color: #856404;
        }

        .actions-cell {
          width: 120px;
        }

        .action-buttons-small {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

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

        .btn-edit {
          background-color: #ffc107;
          color: #7a3b06;
        }

        .btn-delete {
          background-color: #dc3545;
          color: white;
        }

        .btn-edit:hover,
        .btn-delete:hover {
          opacity: 0.8;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #6d4611;
          opacity: 0.7;
        }

        .empty-state .btn {
          margin-top: 12px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .search-section {
            flex-direction: column;
          }
          .search-box {
            min-width: auto;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .form-actions {
            flex-direction: column;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .modal {
            margin: 20px;
          }
          .table-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .action-buttons {
            flex-direction: column;
          }
          .action-buttons .btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}