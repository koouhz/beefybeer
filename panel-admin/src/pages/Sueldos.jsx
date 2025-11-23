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
  BarChart3
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
  const [form, setForm] = useState({ 
    monto: '', 
    descripcion: '', 
    id_cargo: '' 
  });

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("todos");

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
      const [sueldosRes, cargosRes, empleadosRes] = await Promise.all([
        supabase.from('sueldos').select(`
          *,
          cargos (nombre, descripcion)
        `).order('id_sueldo'),
        supabase.from('cargos').select('*').order('id_cargo'),
        supabase.from('empleados').select('ci, nombre, id_cargo')
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

  // Validaciones
  const validateSueldo = (sueldo) => {
    if (!sueldo.monto || parseFloat(sueldo.monto) <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }
    if (!sueldo.id_cargo) {
      throw new Error("Debe seleccionar un cargo");
    }
    if (parseFloat(sueldo.monto) > 100000) {
      throw new Error("El monto no puede exceder Bs 100,000");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateSueldo(form);
      
      const sueldoData = {
        ...form,
        monto: parseFloat(form.monto)
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
    }
  };

  const editarSueldo = (sueldo) => {
    setForm({
      monto: sueldo.monto,
      descripcion: sueldo.descripcion || '',
      id_cargo: sueldo.id_cargo
    });
    setEditingId(sueldo.id_sueldo);
    setShowForm(true);
  };

  const eliminarSueldo = async (id) => {
    // Verificar si hay empleados con este sueldo
    const sueldoAEliminar = sueldos.find(s => s.id_sueldo === id);
    if (sueldoAEliminar) {
      const empleadosConEsteCargo = empleados.filter(emp => emp.id_cargo === sueldoAEliminar.id_cargo);
      if (empleadosConEsteCargo.length > 0) {
        showMessage(`No se puede eliminar. ${empleadosConEsteCargo.length} empleado(s) tienen este cargo asignado`);
        return;
      }
    }

    if (window.confirm('¿Estás seguro de eliminar este sueldo?')) {
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
      }
    }
  };

  const resetForm = () => {
    setForm({ monto: '', descripcion: '', id_cargo: '' });
    setEditingId(null);
    setShowForm(false);
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

  // Estadísticas
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
      : 0
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={32} className="spinner" />
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="page-header">
        <h1>Gestión de Sueldos</h1>
        <p>Administra los sueldos por cargo del personal</p>
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
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{estadisticas.totalSueldos}</div>
            <div className="stat-label">Total Sueldos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
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
          <div className="stat-icon">
            <Briefcase size={24} />
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
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {new Intl.NumberFormat('es-BO', { 
                style: 'currency', 
                currency: 'BOB' 
              }).format(estadisticas.sueldoMinimo)}
            </div>
            <div className="stat-label">Mínimo</div>
          </div>
        </div>
      </div>

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
            <h3>{editingId ? "Editar Sueldo" : "Nuevo Sueldo"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Monto (Bs) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100000"
                    value={form.monto}
                    onChange={(e) => setForm({...form, monto: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                </div>
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
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  placeholder="Descripción adicional del sueldo..."
                  rows="3"
                  maxLength={100}
                />
                <span className="char-count">{form.descripcion?.length || 0}/100</span>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  <Save size={16} />
                  {editingId ? "Actualizar" : "Guardar"}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-cancel">
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
          <DollarSign size={20} />
          <h2>Sueldos ({filteredSueldos.length})</h2>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSueldos.map(sueldo => {
                const empleadosCount = empleados.filter(emp => emp.id_cargo === sueldo.id_cargo).length;
                return (
                  <tr key={sueldo.id_sueldo}>
                    <td className="id-cell">{sueldo.id_sueldo}</td>
                    <td className="amount-cell">
                      <strong>
                        {new Intl.NumberFormat('es-BO', { 
                          style: 'currency', 
                          currency: 'BOB' 
                        }).format(sueldo.monto)}
                      </strong>
                    </td>
                    <td className="name-cell">{sueldo.cargos?.nombre || 'N/A'}</td>
                    <td className="count-cell">
                      <span className={`badge ${empleadosCount > 0 ? 'badge-warning' : 'badge-info'}`}>
                        <Users size={12} />
                        {empleadosCount}
                      </span>
                    </td>
                    <td className="desc-cell">{sueldo.descripcion || '-'}</td>
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
                          title="Eliminar sueldo"
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
          {filteredSueldos.length === 0 && (
            <div className="empty-state">
              <p>No se encontraron sueldos</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1200px;
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

        .filter-select {
          padding: 12px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
          min-width: 200px;
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
          opacity: 0.5;
          cursor: not-allowed;
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
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal h3 {
          color: #7a3b06;
          margin-bottom: 20px;
          font-size: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
          position: relative;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #6d4611;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #7a3b06;
        }

        .char-count {
          position: absolute;
          right: 10px;
          bottom: 10px;
          font-size: 12px;
          color: #6d4611;
          opacity: 0.7;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
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
          min-width: 800px;
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

        .name-cell {
          font-weight: 500;
        }

        .desc-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .count-cell {
          text-align: center;
        }

        .actions-cell {
          width: 100px;
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

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-info {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .badge-warning {
          background-color: #fff3e0;
          color: #f57c00;
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
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}