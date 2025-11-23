// src/pages/Mesas.jsx
import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Table, 
  Search,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Loader,
  Eye,
  Home,
  MapPin
} from "lucide-react";

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editingNroMesa, setEditingNroMesa] = useState(null);
  const [viewMode, setViewMode] = useState("lista");
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const [form, setForm] = useState({
    nromesa: '',
    salon: '',
    capacidad: '',
    estado: 'libre'
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroSalon, setFiltroSalon] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCapacidad, setFiltroCapacidad] = useState("todos");

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
      const [mesasRes, pedidosRes] = await Promise.all([
        supabase.from('mesas').select('*').order('nromesa'),
        supabase.from('pedidos').select('*') // Quitamos el filtro de estado que no existe
      ]);

      if (mesasRes.error) throw mesasRes.error;
      if (pedidosRes.error) throw pedidosRes.error;

      setMesas(mesasRes.data || []);
      setPedidos(pedidosRes.data || []);
    } catch (error) {
      showMessage(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateMesa = (mesa) => {
    if (!mesa.nromesa || parseInt(mesa.nromesa) <= 0) {
      throw new Error("El número de mesa debe ser mayor a 0");
    }
    if (!mesa.salon || parseInt(mesa.salon) < 1 || parseInt(mesa.salon) > 4) {
      throw new Error("El salón debe ser un número entre 1 y 4");
    }
    if (!mesa.capacidad || parseInt(mesa.capacidad) <= 0) {
      throw new Error("La capacidad debe ser mayor a 0");
    }
    if (parseInt(mesa.capacidad) > 20) {
      throw new Error("La capacidad máxima por mesa es 20 personas");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateMesa(form);
      
      const mesaData = {
        ...form,
        nromesa: parseInt(form.nromesa),
        salon: parseInt(form.salon),
        capacidad: parseInt(form.capacidad)
      };

      if (editingNroMesa) {
        const { error } = await supabase
          .from('mesas')
          .update(mesaData)
          .eq('nromesa', editingNroMesa);
        if (error) throw error;
        showMessage("Mesa actualizada exitosamente", "success");
      } else {
        const { data: existe } = await supabase
          .from('mesas')
          .select('nromesa')
          .eq('nromesa', mesaData.nromesa)
          .single();

        if (existe) throw new Error("Ya existe una mesa con este número");

        const { error } = await supabase
          .from('mesas')
          .insert([mesaData]);
        if (error) throw error;
        showMessage("Mesa creada exitosamente", "success");
      }

      resetForm();
      cargarDatos();
    } catch (error) {
      showMessage(error.message);
    }
  };

  const editarMesa = (mesa) => {
    setForm({
      nromesa: mesa.nromesa.toString(),
      salon: mesa.salon.toString(),
      capacidad: mesa.capacidad.toString(),
      estado: mesa.estado
    });
    setEditingNroMesa(mesa.nromesa);
    setShowForm(true);
  };

  const verDetalleMesa = (mesa) => {
    setMesaSeleccionada(mesa);
    setViewMode("detalle");
  };

  const eliminarMesa = async (nromesa) => {
    const pedidosActivos = pedidos.filter(pedido => pedido.nromesa === nromesa);
    if (pedidosActivos.length > 0) {
      showMessage(`No se puede eliminar la mesa. Tiene ${pedidosActivos.length} pedido(s) activo(s)`);
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar esta mesa?')) {
      try {
        const { error } = await supabase
          .from('mesas')
          .delete()
          .eq('nromesa', nromesa);
        if (error) throw error;
        showMessage("Mesa eliminada exitosamente", "success");
        cargarDatos();
      } catch (error) {
        showMessage(`Error eliminando mesa: ${error.message}`);
      }
    }
  };

  const cambiarEstadoMesa = async (nromesa, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('mesas')
        .update({ estado: nuevoEstado })
        .eq('nromesa', nromesa);
      
      if (error) throw error;
      showMessage(`Estado de la mesa actualizado a ${nuevoEstado}`, "success");
      cargarDatos();
    } catch (error) {
      showMessage(`Error actualizando estado: ${error.message}`);
    }
  };

  const resetForm = () => {
    setForm({
      nromesa: '',
      salon: '',
      capacidad: '',
      estado: 'libre'
    });
    setEditingNroMesa(null);
    setShowForm(false);
  };

  const filteredMesas = mesas.filter(mesa => {
    const matchesSearch = 
      mesa.nromesa.toString().includes(searchTerm) ||
      mesa.salon.toString().includes(searchTerm) ||
      mesa.capacidad.toString().includes(searchTerm);

    const matchesSalon = filtroSalon === "todos" || mesa.salon.toString() === filtroSalon;
    const matchesEstado = filtroEstado === "todos" || mesa.estado === filtroEstado;
    
    const matchesCapacidad = filtroCapacidad === "todos" || 
      (filtroCapacidad === "pequena" && mesa.capacidad <= 2) ||
      (filtroCapacidad === "mediana" && mesa.capacidad > 2 && mesa.capacidad <= 6) ||
      (filtroCapacidad === "grande" && mesa.capacidad > 6);

    return matchesSearch && matchesSalon && matchesEstado && matchesCapacidad;
  });

  const estadisticas = {
    totalMesas: mesas.length,
    mesasLibres: mesas.filter(m => m.estado === 'libre').length,
    mesasOcupadas: mesas.filter(m => m.estado === 'ocupada').length,
    mesasReservadas: mesas.filter(m => m.estado === 'reservada').length,
    capacidadTotal: mesas.reduce((total, mesa) => total + mesa.capacidad, 0),
    salones: [...new Set(mesas.map(m => m.salon))].length
  };

  const getPedidosMesa = (nromesa) => {
    return pedidos.filter(pedido => pedido.nromesa === nromesa);
  };

  const getInfoSalon = (salon) => {
    const salones = {
      1: { nombre: "Salón Principal", capacidad: 50 },
      2: { nombre: "Terraza", capacidad: 30 },
      3: { nombre: "Privado VIP", capacidad: 20 },
      4: { nombre: "Jardín", capacidad: 40 }
    };
    return salones[salon] || { nombre: `Salón ${salon}`, capacidad: 0 };
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "60px 20px", 
        color: "#7a3b06" 
      }}>
        <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
        <p>Cargando mesas...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px", fontWeight: "700" }}>
          Gestión de Mesas
        </h1>
        <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
          Administra la disposición y estado de las mesas del restaurante
        </p>
      </header>

      {error && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          backgroundColor: "#fee",
          border: "1px solid #f5c6cb",
          color: "#721c24"
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button 
            onClick={() => setError("")} 
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.7
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          backgroundColor: "#f0fff4",
          border: "1px solid #c3e6cb",
          color: "#155724"
        }}>
          <CheckCircle size={20} />
          <span>{success}</span>
          <button 
            onClick={() => setSuccess("")} 
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.7
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {viewMode === "detalle" && mesaSeleccionada && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e9d8b5",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "20px",
            borderBottom: "1px solid #e9d8b5",
            backgroundColor: "#f8f5ee",
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            <button 
              onClick={() => setViewMode("lista")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                backgroundColor: "#6d4611",
                color: "white"
              }}
            >
              ← Volver al listado
            </button>
            <h2 style={{ color: "#7a3b06", margin: 0 }}>
              Detalle de Mesa {mesaSeleccionada.nromesa}
            </h2>
          </div>
          
          <div style={{ padding: "30px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "30px",
              marginBottom: "30px"
            }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                  padding: "15px",
                  background: "#f8f5ee",
                  borderRadius: "8px"
                }}>
                  <Table size={24} style={{ color: "#7a3b06", marginTop: "2px" }} />
                  <div>
                    <div style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6d4611",
                      opacity: 0.8,
                      marginBottom: "4px"
                    }}>
                      Número de Mesa
                    </div>
                    <div style={{
                      display: "block",
                      fontWeight: "500",
                      color: "#7a3b06",
                      fontSize: "24px",
                      fontWeight: "700"
                    }}>
                      {mesaSeleccionada.nromesa}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                  padding: "15px",
                  background: "#f8f5ee",
                  borderRadius: "8px"
                }}>
                  <Home size={24} style={{ color: "#7a3b06", marginTop: "2px" }} />
                  <div>
                    <div style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6d4611",
                      opacity: 0.8,
                      marginBottom: "4px"
                    }}>
                      Salón
                    </div>
                    <div style={{
                      display: "block",
                      fontWeight: "500",
                      color: "#7a3b06"
                    }}>
                      {getInfoSalon(mesaSeleccionada.salon).nombre} (Salón {mesaSeleccionada.salon})
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                  padding: "15px",
                  background: "#f8f5ee",
                  borderRadius: "8px"
                }}>
                  <Users size={24} style={{ color: "#7a3b06", marginTop: "2px" }} />
                  <div>
                    <div style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6d4611",
                      opacity: 0.8,
                      marginBottom: "4px"
                    }}>
                      Capacidad
                    </div>
                    <div style={{
                      display: "block",
                      fontWeight: "500",
                      color: "#7a3b06"
                    }}>
                      {mesaSeleccionada.capacidad} personas
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                  padding: "15px",
                  background: "#f8f5ee",
                  borderRadius: "8px"
                }}>
                  <Clock size={24} style={{ color: "#7a3b06", marginTop: "2px" }} />
                  <div>
                    <div style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6d4611",
                      opacity: 0.8,
                      marginBottom: "4px"
                    }}>
                      Estado Actual
                    </div>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "600",
                      backgroundColor: mesaSeleccionada.estado === 'libre' ? "#e8f5e8" : 
                                       mesaSeleccionada.estado === 'ocupada' ? "#fff5f5" : "#fff3cd",
                      color: mesaSeleccionada.estado === 'libre' ? "#28a745" : 
                             mesaSeleccionada.estado === 'ocupada' ? "#dc3545" : "#856404"
                    }}>
                      {mesaSeleccionada.estado === 'libre' && <CheckCircle2 size={16} />}
                      {mesaSeleccionada.estado === 'ocupada' && <XCircle size={16} />}
                      {mesaSeleccionada.estado === 'reservada' && <AlertTriangle size={16} />}
                      {mesaSeleccionada.estado}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: "#e3f2fd",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #bbdefb"
              }}>
                <h4 style={{ color: "#1976d2", marginBottom: "15px" }}>Acciones Rápidas</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={() => cambiarEstadoMesa(mesaSeleccionada.nromesa, 'libre')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      border: `2px solid ${mesaSeleccionada.estado === 'libre' ? "#7a3b06" : "#e9d8b5"}`,
                      borderRadius: "8px",
                      background: mesaSeleccionada.estado === 'libre' ? "#7a3b06" : "white",
                      color: mesaSeleccionada.estado === 'libre' ? "white" : "#6d4611",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Liberar
                  </button>
                  <button
                    onClick={() => cambiarEstadoMesa(mesaSeleccionada.nromesa, 'ocupada')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      border: `2px solid ${mesaSeleccionada.estado === 'ocupada' ? "#7a3b06" : "#e9d8b5"}`,
                      borderRadius: "8px",
                      background: mesaSeleccionada.estado === 'ocupada' ? "#7a3b06" : "white",
                      color: mesaSeleccionada.estado === 'ocupada' ? "white" : "#6d4611",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Users size={16} />
                    Ocupar
                  </button>
                  <button
                    onClick={() => cambiarEstadoMesa(mesaSeleccionada.nromesa, 'reservada')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      border: `2px solid ${mesaSeleccionada.estado === 'reservada' ? "#7a3b06" : "#e9d8b5"}`,
                      borderRadius: "8px",
                      background: mesaSeleccionada.estado === 'reservada' ? "#7a3b06" : "white",
                      color: mesaSeleccionada.estado === 'reservada' ? "white" : "#6d4611",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Clock size={16} />
                    Reservar
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: "white",
              borderRadius: "8px",
              border: "1px solid #e9d8b5",
              padding: "20px"
            }}>
              <h4 style={{ color: "#7a3b06", marginBottom: "15px" }}>Pedidos Activos</h4>
              {getPedidosMesa(mesaSeleccionada.nromesa).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {getPedidosMesa(mesaSeleccionada.nromesa).map(pedido => (
                    <div key={pedido.id_pedido} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "15px",
                      background: "#f8f5ee",
                      borderRadius: "6px"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "block", color: "#7a3b06", marginBottom: "4px", fontWeight: "bold" }}>
                          Pedido #{pedido.id_pedido}
                        </div>
                        <div style={{ color: "#6d4611", fontSize: "14px" }}>
                          {pedido.detalle || 'Sin detalles'}
                        </div>
                      </div>
                      <div>
                        <button style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 16px",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: "#17a2b8",
                          color: "white"
                        }}>
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px", color: "#6d4611", opacity: 0.7 }}>
                  <p>No hay pedidos activos para esta mesa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "lista" && (
        <>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "24px"
          }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={18} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6d4611"
              }} />
              <input
                type="text"
                placeholder="Buscar por número, salón o capacidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select 
                value={filtroSalon}
                onChange={(e) => setFiltroSalon(e.target.value)}
                style={{
                  padding: "12px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minWidth: "180px"
                }}
              >
                <option value="todos">Todos los salones</option>
                <option value="1">Salón 1 - Principal</option>
                <option value="2">Salón 2 - Terraza</option>
                <option value="3">Salón 3 - VIP</option>
                <option value="4">Salón 4 - Jardín</option>
              </select>
              <select 
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{
                  padding: "12px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minWidth: "180px"
                }}
              >
                <option value="todos">Todos los estados</option>
                <option value="libre">Libre</option>
                <option value="ocupada">Ocupada</option>
                <option value="reservada">Reservada</option>
              </select>
              <select 
                value={filtroCapacidad}
                onChange={(e) => setFiltroCapacidad(e.target.value)}
                style={{
                  padding: "12px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minWidth: "180px"
                }}
              >
                <option value="todos">Todas las capacidades</option>
                <option value="pequena">Pequeña (1-2 pers.)</option>
                <option value="mediana">Mediana (3-6 pers.)</option>
                <option value="grande">Grande (7+ pers.)</option>
              </select>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px"
          }}>
            {[
              { label: "Total Mesas", value: estadisticas.totalMesas, icon: Table, color: "#e3f2fd", iconColor: "#1976d2" },
              { label: "Libres", value: estadisticas.mesasLibres, icon: CheckCircle2, color: "#e8f5e8", iconColor: "#28a745" },
              { label: "Ocupadas", value: estadisticas.mesasOcupadas, icon: Users, color: "#fff5f5", iconColor: "#dc3545" },
              { label: "Reservadas", value: estadisticas.mesasReservadas, icon: Clock, color: "#fff3cd", iconColor: "#856404" },
              { label: "Capacidad Total", value: estadisticas.capacidadTotal, icon: Users, color: "#f3e5f5", iconColor: "#7b1fa2" }
            ].map((stat, index) => (
              <div key={index} style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #e9d8b5",
                display: "flex",
                alignItems: "center",
                gap: "16px"
              }}>
                <div style={{
                  background: stat.color,
                  padding: "12px",
                  borderRadius: "8px",
                  color: stat.iconColor
                }}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <div style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#7a3b06"
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "#6d4611",
                    opacity: 0.8
                  }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <button 
              onClick={() => { resetForm(); setShowForm(true); }} 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                backgroundColor: "#7a3b06",
                color: "white"
              }}
            >
              <Plus size={16} />
              Nueva Mesa
            </button>
          </div>

          {showForm && (
            <div style={{
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
            }}>
              <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9d8b5",
                maxWidth: "500px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto"
              }}>
                <h3 style={{ color: "#7a3b06", marginBottom: "20px", fontSize: "20px" }}>
                  {editingNroMesa ? "Editar Mesa" : "Nueva Mesa"}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#6d4611",
                        fontWeight: "500"
                      }}>
                        Número de Mesa *
                      </label>
                      <input
                        type="number"
                        value={form.nromesa}
                        onChange={(e) => setForm({...form, nromesa: e.target.value})}
                        required
                        min="1"
                        disabled={!!editingNroMesa}
                        placeholder="Ej: 1, 2, 3..."
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #e9d8b5",
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#6d4611",
                        fontWeight: "500"
                      }}>
                        Salón *
                      </label>
                      <select
                        value={form.salon}
                        onChange={(e) => setForm({...form, salon: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #e9d8b5",
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      >
                        <option value="">Seleccionar salón</option>
                        <option value="1">Salón 1 - Principal</option>
                        <option value="2">Salón 2 - Terraza</option>
                        <option value="3">Salón 3 - VIP</option>
                        <option value="4">Salón 4 - Jardín</option>
                      </select>
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#6d4611",
                        fontWeight: "500"
                      }}>
                        Capacidad *
                      </label>
                      <input
                        type="number"
                        value={form.capacidad}
                        onChange={(e) => setForm({...form, capacidad: e.target.value})}
                        required
                        min="1"
                        max="20"
                        placeholder="Número de personas"
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #e9d8b5",
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#6d4611",
                        fontWeight: "500"
                      }}>
                        Estado Inicial
                      </label>
                      <select
                        value={form.estado}
                        onChange={(e) => setForm({...form, estado: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #e9d8b5",
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      >
                        <option value="libre">Libre</option>
                        <option value="ocupada">Ocupada</option>
                        <option value="reservada">Reservada</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button type="submit" style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      backgroundColor: "#28a745",
                      color: "white"
                    }}>
                      <Save size={16} />
                      {editingNroMesa ? "Actualizar" : "Guardar"}
                    </button>
                    <button type="button" onClick={resetForm} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      backgroundColor: "#6c757d",
                      color: "white"
                    }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e9d8b5",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #e9d8b5",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#f8f5ee"
            }}>
              <Table size={20} style={{ color: "#7a3b06" }} />
              <h2 style={{ color: "#7a3b06", margin: 0, fontSize: "18px", flex: 1 }}>
                Mesas ({filteredMesas.length})
              </h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: "#e8f5e8",
                  color: "#28a745"
                }}>
                  {estadisticas.mesasLibres} libres
                </span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: "#fff5f5",
                  color: "#dc3545"
                }}>
                  {estadisticas.mesasOcupadas} ocupadas
                </span>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f5ee" }}>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600" }}>Nro Mesa</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600" }}>Salón</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600" }}>Capacidad</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600" }}>Estado</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600" }}>Pedidos Activos</th>
                    <th style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", fontWeight: "600" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMesas.map(mesa => {
                    const pedidosActivos = getPedidosMesa(mesa.nromesa);
                    const estadoStyles = {
                      libre: { backgroundColor: "#f8fff8" },
                      ocupada: { backgroundColor: "#fff5f5" },
                      reservada: { backgroundColor: "#fffdf5" }
                    };
                    
                    const selectStyles = {
                      libre: { backgroundColor: "#e8f5e8", color: "#28a745" },
                      ocupada: { backgroundColor: "#fff5f5", color: "#dc3545" },
                      reservada: { backgroundColor: "#fff3cd", color: "#856404" }
                    };

                    return (
                      <tr key={mesa.nromesa} style={estadoStyles[mesa.estado] || {}}>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <strong style={{ color: "#7a3b06", fontSize: "16px" }}>#{mesa.nromesa}</strong>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" }}>
                              <MapPin size={14} />
                              Salón {mesa.salon}
                            </span>
                            <small style={{ color: "#6d4611", opacity: 0.8, fontSize: "12px" }}>
                              {getInfoSalon(mesa.salon).nombre}
                            </small>
                          </div>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Users size={14} />
                            <span>{mesa.capacidad} personas</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          <select
                            value={mesa.estado}
                            onChange={(e) => cambiarEstadoMesa(mesa.nromesa, e.target.value)}
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #e9d8b5",
                              borderRadius: "6px",
                              fontSize: "14px",
                              cursor: "pointer",
                              ...selectStyles[mesa.estado]
                            }}
                          >
                            <option value="libre">Libre</option>
                            <option value="ocupada">Ocupada</option>
                            <option value="reservada">Reservada</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611" }}>
                          {pedidosActivos.length > 0 ? (
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: "#fff5f5",
                              color: "#dc3545"
                            }}>
                              {pedidosActivos.length} activos
                            </span>
                          ) : (
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: "#f8f9fa",
                              color: "#6c757d"
                            }}>
                              Sin pedidos
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px", border: "1px solid #e9d8b5", color: "#6d4611", width: "140px" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => verDetalleMesa(mesa)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 8px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#17a2b8",
                                color: "white"
                              }}
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => editarMesa(mesa)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 8px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#ffc107",
                                color: "#7a3b06"
                              }}
                              title="Editar mesa"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => eliminarMesa(mesa.nromesa)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 8px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                backgroundColor: "#dc3545",
                                color: "white"
                              }}
                              title="Eliminar mesa"
                              disabled={pedidosActivos.length > 0}
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
              {filteredMesas.length === 0 && (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "#6d4611", opacity: 0.7 }}>
                  <Table size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                  <p>No se encontraron mesas</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}