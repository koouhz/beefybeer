// src/pages/Gastos.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  DollarSign, 
  Search, 
  Filter, 
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Building,
  Utensils,
  Truck,
  Users
} from "lucide-react";

export default function Gastos() {
  const [egresos, setEgresos] = useState([]);
  const [sueldos, setSueldos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterMonto, setFilterMonto] = useState("");
  const [sortField, setSortField] = useState("fecha");
  const [sortDirection, setSortDirection] = useState("desc");
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    detalle: '',
    monto: '',
    id_sueldo: ''
  });

  // Categorías basadas en sueldos (usando cargos como categorías)
  const categoriasGastos = [
    { id: 'sueldos', nombre: 'Sueldos y Salarios', icon: Users },
    { id: 'operativos', nombre: 'Gastos Operativos', icon: Building },
    { id: 'insumos', nombre: 'Insumos', icon: Utensils },
    { id: 'servicios', nombre: 'Servicios', icon: Truck },
    { id: 'otros', nombre: 'Otros Gastos', icon: DollarSign }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar egresos con información relacionada
      const [egresosRes, sueldosRes, cargosRes, empleadosRes] = await Promise.all([
        supabase
          .from('egresos')
          .select(`
            *,
            sueldos (
              monto,
              descripcion,
              cargos (
                nombre,
                descripcion
              )
            )
          `)
          .order('id_egreso', { ascending: false }),
        supabase
          .from('sueldos')
          .select(`
            *,
            cargos (
              nombre,
              descripcion
            )
          `),
        supabase
          .from('cargos')
          .select('*'),
        supabase
          .from('empleados')
          .select('ci, nombre, pat, mat')
      ]);
      
      if (egresosRes.error) throw egresosRes.error;
      if (sueldosRes.error) throw sueldosRes.error;
      if (cargosRes.error) throw cargosRes.error;
      if (empleadosRes.error) throw empleadosRes.error;
      
      setEgresos(egresosRes.data || []);
      setSueldos(sueldosRes.data || []);
      setCargos(cargosRes.data || []);
      setEmpleados(empleadosRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      mostrarNotificacion('Error al cargar datos: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const validarForm = () => {
    const errors = {};
    
    if (!form.detalle.trim()) {
      errors.detalle = "El detalle es obligatorio";
    } else if (form.detalle.length < 3) {
      errors.detalle = "El detalle debe tener al menos 3 caracteres";
    }
    
    if (!form.monto || parseFloat(form.monto) <= 0) {
      errors.monto = "El monto debe ser mayor a 0";
    } else if (parseFloat(form.monto) > 1000000) {
      errors.monto = "El monto no puede exceder 1,000,000 Bs";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarForm()) return;

    try {
      const datos = {
        detalle: form.detalle.trim(),
        monto: parseFloat(form.monto),
        id_sueldo: form.id_sueldo || null
      };

      let error;
      if (editingId) {
        const { error: updateError } = await supabase
          .from('egresos')
          .update(datos)
          .eq('id_egreso', editingId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('egresos')
          .insert([datos]);
        error = insertError;
      }
      
      if (error) throw error;
      
      mostrarNotificacion(
        editingId ? 'Gasto actualizado correctamente' : 'Gasto creado correctamente',
        'success'
      );
      
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error('Error guardando gasto:', error);
      mostrarNotificacion('Error al guardar gasto: ' + error.message, 'error');
    }
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('egresos')
        .delete()
        .eq('id_egreso', id);
      
      if (error) throw error;
      
      mostrarNotificacion('Gasto eliminado correctamente', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      mostrarNotificacion('Error al eliminar gasto: ' + error.message, 'error');
    }
  };

  const editarGasto = (egreso) => {
    setForm({
      detalle: egreso.detalle || '',
      monto: egreso.monto || '',
      id_sueldo: egreso.id_sueldo || ''
    });
    setEditingId(egreso.id_egreso);
    setShowForm(true);
    setFormErrors({});
  };

  const resetForm = () => {
    setForm({ 
      detalle: '', 
      monto: '', 
      id_sueldo: ''
    });
    setEditingId(null);
    setShowForm(false);
    setFormErrors({});
  };

  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    // Implementación temporal
    console.log(`${tipo}: ${mensaje}`);
    alert(mensaje);
  };

  // Filtros y búsqueda
  const gastosFiltrados = egresos.filter(egreso => {
    const coincideBusqueda = egreso.detalle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           egreso.id_egreso?.toString().includes(searchTerm);
    
    const coincideCategoria = !filterCategoria || 
      (filterCategoria === 'sueldos' && egreso.id_sueldo) ||
      (filterCategoria === 'operativos' && !egreso.id_sueldo);
    
    const coincideMonto = !filterMonto || (
      filterMonto === "menor100" && egreso.monto < 100 ||
      filterMonto === "100-500" && egreso.monto >= 100 && egreso.monto <= 500 ||
      filterMonto === "500-1000" && egreso.monto > 500 && egreso.monto <= 1000 ||
      filterMonto === "mayor1000" && egreso.monto > 1000
    );
    
    return coincideBusqueda && coincideCategoria && coincideMonto;
  });

  const gastosOrdenados = [...gastosFiltrados].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'monto') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    } else if (sortField === 'id_egreso') {
      aVal = parseInt(aVal);
      bVal = parseInt(bVal);
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const ordenarPor = (campo) => {
    if (sortField === campo) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(campo);
      setSortDirection('asc');
    }
  };

  const getCategoriaGasto = (egreso) => {
    if (egreso.id_sueldo) {
      return { id: 'sueldos', nombre: 'Sueldos y Salarios', icon: Users };
    }
    
    // Determinar categoría basada en el detalle
    const detalle = egreso.detalle?.toLowerCase() || '';
    if (detalle.includes('insumo') || detalle.includes('materia') || detalle.includes('producto')) {
      return { id: 'insumos', nombre: 'Insumos', icon: Utensils };
    } else if (detalle.includes('servicio') || detalle.includes('agua') || detalle.includes('luz') || detalle.includes('gas')) {
      return { id: 'servicios', nombre: 'Servicios', icon: Truck };
    } else if (detalle.includes('operativo') || detalle.includes('administrativo')) {
      return { id: 'operativos', nombre: 'Gastos Operativos', icon: Building };
    }
    
    return { id: 'otros', nombre: 'Otros Gastos', icon: DollarSign };
  };

  const getTotalGastos = () => {
    return egresos.reduce((sum, egreso) => sum + (egreso.monto || 0), 0);
  };

  const getGastosSueldos = () => {
    return egresos.reduce((sum, egreso) => 
      egreso.id_sueldo ? sum + (egreso.monto || 0) : sum, 0
    );
  };

  const getGastosOperativos = () => {
    return egresos.reduce((sum, egreso) => 
      !egreso.id_sueldo ? sum + (egreso.monto || 0) : sum, 0
    );
  };

  const getInfoSueldo = (idSueldo) => {
    if (!idSueldo) return null;
    const sueldo = sueldos.find(s => s.id_sueldo === idSueldo);
    return sueldo;
  };

  const exportarDatos = () => {
    const datos = gastosOrdenados.map(egreso => {
      const categoria = getCategoriaGasto(egreso);
      const sueldoInfo = getInfoSueldo(egreso.id_sueldo);
      
      return {
        ID: egreso.id_egreso,
        Detalle: egreso.detalle,
        Monto: egreso.monto,
        Categoría: categoria.nombre,
        'Tipo Gasto': egreso.id_sueldo ? 'Sueldo' : 'Gasto Operativo',
        'Cargo Relacionado': sueldoInfo?.cargos?.nombre || 'N/A',
        'Descripción Sueldo': sueldoInfo?.descripcion || 'N/A'
      };
    });
    
    const csv = convertirACSV(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertirACSV = (datos) => {
    if (datos.length === 0) return '';
    
    const headers = Object.keys(datos[0]);
    const csv = [
      headers.join(','),
      ...datos.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    return csv;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="loading-spinner" />
        <p>Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">
          <DollarSign className="icon-title" />
          Gestión de Gastos
        </h1>
        <p className="page-subtitle">Administra y controla todos los gastos del restaurante</p>
      </header>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {new Intl.NumberFormat('es-BO', { 
                style: 'currency', 
                currency: 'BOB' 
              }).format(getTotalGastos())}
            </h3>
            <p className="stat-label">Total Gastos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon sueldos">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {new Intl.NumberFormat('es-BO', { 
                style: 'currency', 
                currency: 'BOB' 
              }).format(getGastosSueldos())}
            </h3>
            <p className="stat-label">Gastos en Sueldos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon operativos">
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {new Intl.NumberFormat('es-BO', { 
                style: 'currency', 
                currency: 'BOB' 
              }).format(getGastosOperativos())}
            </h3>
            <p className="stat-label">Gastos Operativos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon count">
            <Filter size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{egresos.length}</h3>
            <p className="stat-label">Total Registros</p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="controls-section">
        <div className="controls-left">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Nuevo Gasto
          </button>
          
          <button className="btn btn-secondary" onClick={exportarDatos}>
            <Download size={16} />
            Exportar
          </button>
          
          <button className="btn btn-outline" onClick={cargarDatos}>
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
        
        <div className="controls-right">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por detalle o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">
            <Filter size={14} />
            Filtros:
          </label>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {categoriasGastos.map(categoria => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          
          <select
            value={filterMonto}
            onChange={(e) => setFilterMonto(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los montos</option>
            <option value="menor100">Menor a 100 Bs</option>
            <option value="100-500">100 - 500 Bs</option>
            <option value="500-1000">500 - 1,000 Bs</option>
            <option value="mayor1000">Mayor a 1,000 Bs</option>
          </select>
        </div>
        
        <div className="results-info">
          Mostrando {gastosOrdenados.length} de {egresos.length} gastos
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingId ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
              <button onClick={resetForm} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-content">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Monto (Bs) *
                    {formErrors.monto && (
                      <span className="error-icon" title={formErrors.monto}>
                        <AlertTriangle size={14} />
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    value={form.monto}
                    onChange={(e) => setForm({...form, monto: e.target.value})}
                    className={`form-input ${formErrors.monto ? 'error' : ''}`}
                    placeholder="0.00"
                  />
                  {formErrors.monto && (
                    <span className="error-message">{formErrors.monto}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Relacionar con Sueldo</label>
                  <select
                    value={form.id_sueldo}
                    onChange={(e) => setForm({...form, id_sueldo: e.target.value})}
                    className="form-input"
                  >
                    <option value="">Sin relación con sueldo</option>
                    {sueldos.map(sueldo => (
                      <option key={sueldo.id_sueldo} value={sueldo.id_sueldo}>
                        {sueldo.cargos?.nombre} - {new Intl.NumberFormat('es-BO', { 
                          style: 'currency', 
                          currency: 'BOB' 
                        }).format(sueldo.monto)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Detalle del Gasto *
                  {formErrors.detalle && (
                    <span className="error-icon" title={formErrors.detalle}>
                      <AlertTriangle size={14} />
                    </span>
                  )}
                </label>
                <textarea
                  value={form.detalle}
                  onChange={(e) => setForm({...form, detalle: e.target.value})}
                  className={`form-input ${formErrors.detalle ? 'error' : ''}`}
                  placeholder="Describe el gasto realizado..."
                  rows="3"
                  maxLength="500"
                />
                {formErrors.detalle && (
                  <span className="error-message">{formErrors.detalle}</span>
                )}
                <div className="char-counter">
                  {form.detalle.length}/500 caracteres
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  <CheckCircle size={16} />
                  {editingId ? 'Actualizar Gasto' : 'Guardar Gasto'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-danger">
                  <X size={16} />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Gastos */}
      <div className="table-container">
        <div className="table-header">
          <h2>Historial de Gastos</h2>
        </div>
        
        {gastosOrdenados.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={48} className="empty-icon" />
            <h3>No se encontraron gastos</h3>
            <p>No hay gastos que coincidan con los filtros aplicados</p>
            <button className="btn btn-primary" onClick={() => {
              setSearchTerm('');
              setFilterCategoria('');
              setFilterMonto('');
            }}>
              <Filter size={16} />
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    className="sortable" 
                    onClick={() => ordenarPor('id_egreso')}
                  >
                    ID {sortField === 'id_egreso' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => ordenarPor('detalle')}
                  >
                    Detalle {sortField === 'detalle' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Categoría</th>
                  <th 
                    className="sortable" 
                    onClick={() => ordenarPor('monto')}
                  >
                    Monto {sortField === 'monto' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Tipo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastosOrdenados.map(egreso => {
                  const categoria = getCategoriaGasto(egreso);
                  const IconoCategoria = categoria.icon;
                  const sueldoInfo = getInfoSueldo(egreso.id_sueldo);
                  
                  return (
                    <tr key={egreso.id_egreso} className="table-row">
                      <td className="table-cell id-cell">#{egreso.id_egreso}</td>
                      <td className="table-cell detail-cell">{egreso.detalle}</td>
                      <td className="table-cell category-cell">
                        <span className="category-tag">
                          <IconoCategoria size={14} />
                          {categoria.nombre}
                        </span>
                      </td>
                      <td className="table-cell amount-cell">
                        <span className="amount-badge">
                          {new Intl.NumberFormat('es-BO', { 
                            style: 'currency', 
                            currency: 'BOB' 
                          }).format(egreso.monto || 0)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {egreso.id_sueldo ? (
                          <span className="sueldo-tag">
                            Sueldo - {sueldoInfo?.cargos?.nombre || 'N/A'}
                          </span>
                        ) : (
                          <span className="gasto-tag">Gasto Operativo</span>
                        )}
                      </td>
                      <td className="table-cell actions-cell">
                        <div className="action-buttons">
                          <button 
                            onClick={() => editarGasto(egreso)}
                            className="btn-action edit"
                            title="Editar gasto"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => eliminarGasto(egreso.id_egreso)}
                            className="btn-action delete"
                            title="Eliminar gasto"
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
        )}
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

        .page-title {
          font-size: 28px;
          color: #7a3b06;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .page-subtitle {
          color: #6d4611;
          opacity: 0.8;
          margin: 0;
        }

        .icon-title {
          color: #7a3b06;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(122, 59, 6, 0.1);
        }

        .stat-icon {
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.total {
          background: #e3f2fd;
          color: #1976d2;
        }

        .stat-icon.sueldos {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .stat-icon.operativos {
          background: #fff3e0;
          color: #f57c00;
        }

        .stat-icon.count {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          color: #7a3b06;
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .stat-label {
          color: #6d4611;
          font-size: 14px;
          margin: 0;
          opacity: 0.8;
        }

        /* Controls */
        .controls-section {
          display: flex;
          justify-content: between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .controls-left {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .controls-right {
          margin-left: auto;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #7a3b06;
          color: white;
        }

        .btn-primary:hover {
          background: #6d4611;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
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

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        /* Search */
        .search-box {
          position: relative;
          min-width: 300px;
        }

        .search-input {
          width: 100%;
          padding: 10px 10px 10px 35px;
          border: 1px solid #e9d8b5;
          border-radius: 8px;
          font-size: 14px;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #6d4611;
          opacity: 0.6;
        }

        /* Filters */
        .filters-section {
          display: flex;
          justify-content: between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f5ee;
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-label {
          color: #6d4611;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #e9d8b5;
          border-radius: 6px;
          background: white;
          font-size: 14px;
        }

        .results-info {
          color: #6d4611;
          font-size: 14px;
          margin-left: auto;
        }

        /* Form */
        .form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .form-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .form-header {
          padding: 20px;
          border-bottom: 1px solid #e9d8b5;
          display: flex;
          justify-content: between;
          align-items: center;
        }

        .form-header h3 {
          color: #7a3b06;
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6d4611;
          padding: 5px;
        }

        .form-content {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-label {
          display: block;
          margin-bottom: 5px;
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
        }

        .error-icon {
          color: #dc3545;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }

        .char-counter {
          text-align: right;
          font-size: 12px;
          color: #6d4611;
          opacity: 0.6;
          margin-top: 5px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        /* Table */
        .table-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e9d8b5;
          overflow: hidden;
        }

        .table-header {
          padding: 20px;
          border-bottom: 1px solid #e9d8b5;
        }

        .table-header h2 {
          color: #7a3b06;
          margin: 0;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f8f5ee;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #7a3b06;
          border-bottom: 1px solid #e9d8b5;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
        }

        .sortable:hover {
          background: #e9d8b5;
        }

        .table-cell {
          padding: 12px;
          border-bottom: 1px solid #e9d8b5;
        }

        .table-row:hover {
          background: #f8f5ee;
        }

        .id-cell {
          font-weight: 600;
          color: #7a3b06;
        }

        .detail-cell {
          max-width: 300px;
          word-wrap: break-word;
        }

        .category-cell {
          white-space: nowrap;
        }

        .category-tag {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .amount-cell {
          font-weight: 600;
        }

        .amount-badge {
          background: #fff5f5;
          color: #dc3545;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
        }

        .sueldo-tag {
          background: #e8f5e8;
          color: #2e7d32;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .gasto-tag {
          background: #fff3cd;
          color: #856404;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .actions-cell {
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          gap: 5px;
        }

        .btn-action {
          padding: 6px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-action.edit {
          background: #fff3cd;
          color: #856404;
        }

        .btn-action.edit:hover {
          background: #ffeaa7;
        }

        .btn-action.delete {
          background: #f8d7da;
          color: #721c24;
        }

        .btn-action.delete:hover {
          background: #f1b0b7;
        }

        /* Empty State */
        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #6d4611;
        }

        .empty-icon {
          opacity: 0.5;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #7a3b06;
        }

        .empty-state p {
          margin: 0 0 20px 0;
          opacity: 0.7;
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #7a3b06;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .controls-section {
            flex-direction: column;
            align-items: stretch;
          }

          .controls-left {
            justify-content: center;
          }

          .controls-right {
            margin-left: 0;
          }

          .search-box {
            min-width: auto;
          }

          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-group {
            justify-content: center;
          }

          .results-info {
            margin-left: 0;
            text-align: center;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .data-table {
            font-size: 14px;
          }

          .table-cell {
            padding: 8px;
          }
        }

        @media (max-width: 480px) {
          .btn {
            padding: 8px 12px;
            font-size: 12px;
          }

          .page-title {
            font-size: 24px;
          }

          .stat-card {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
}