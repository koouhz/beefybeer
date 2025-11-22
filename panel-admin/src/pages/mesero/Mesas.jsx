import { useState, useEffect } from "react";
import { supabase } from "../../bd/supabaseClient";
import { Users, Clock, CheckCircle, XCircle, Plus } from "lucide-react";

export default function MesasMesero() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    try {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .order('salon')
        .order('nromesa');

      if (error) throw error;
      setMesas(data || []);
    } catch (error) {
      console.error('Error cargando mesas:', error);
    }
    setLoading(false);
  };

  const cambiarEstadoMesa = async (nromesa, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('mesas')
        .update({ estado: nuevoEstado })
        .eq('nromesa', nromesa);

      if (error) throw error;
      cargarMesas();
    } catch (error) {
      console.error('Error actualizando mesa:', error);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'libre': return '#28a745';
      case 'ocupada': return '#dc3545';
      case 'reservada': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'libre': return 'Libre';
      case 'ocupada': return 'Ocupada';
      case 'reservada': return 'Reservada';
      default: return estado;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#7a3b06" }}>
        Cargando mesas...
      </div>
    );
  }

  // Agrupar mesas por salón
  const mesasPorSalon = mesas.reduce((acc, mesa) => {
    if (!acc[mesa.salon]) acc[mesa.salon] = [];
    acc[mesa.salon].push(mesa);
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px" }}>
          Gestión de Mesas
        </h1>
        <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
          Administra el estado de las mesas en tiempo real
        </p>
      </header>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "20px" 
      }}>
        {Object.entries(mesasPorSalon).map(([salon, mesasSalon]) => (
          <div key={salon} style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e9d8b5",
            padding: "20px"
          }}>
            <h3 style={{ 
              color: "#7a3b06", 
              marginBottom: "15px",
              fontSize: "18px",
              fontWeight: "600"
            }}>
              Salón {salon}
            </h3>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "12px"
            }}>
              {mesasSalon.map(mesa => (
                <div
                  key={mesa.nromesa}
                  style={{
                    background: mesa.estado === 'ocupada' ? '#fff5f5' : 
                               mesa.estado === 'reservada' ? '#fffbf0' : '#f8fff9',
                    border: `2px solid ${getEstadoColor(mesa.estado)}`,
                    borderRadius: "10px",
                    padding: "15px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#7a3b06",
                    marginBottom: "5px"
                  }}>
                    Mesa {mesa.nromesa}
                  </div>
                  
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    marginBottom: "8px"
                  }}>
                    <Users size={14} color="#6d4611" />
                    <span style={{ fontSize: "12px", color: "#6d4611" }}>
                      {mesa.capacidad} pers.
                    </span>
                  </div>

                  <div style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: getEstadoColor(mesa.estado),
                    marginBottom: "10px"
                  }}>
                    {getEstadoTexto(mesa.estado)}
                  </div>

                  <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                    {mesa.estado === 'libre' && (
                      <button
                        onClick={() => cambiarEstadoMesa(mesa.nromesa, 'ocupada')}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                      >
                        Ocupar
                      </button>
                    )}
                    
                    {mesa.estado === 'ocupada' && (
                      <button
                        onClick={() => cambiarEstadoMesa(mesa.nromesa, 'libre')}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                      >
                        Liberar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de estados */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e9d8b5",
        padding: "20px",
        marginTop: "30px"
      }}>
        <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Resumen de Estados</h3>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#28a745", borderRadius: "50%" }}></div>
            <span style={{ color: "#6d4611", fontSize: "14px" }}>
              Libres: {mesas.filter(m => m.estado === 'libre').length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#dc3545", borderRadius: "50%" }}></div>
            <span style={{ color: "#6d4611", fontSize: "14px" }}>
              Ocupadas: {mesas.filter(m => m.estado === 'ocupada').length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#ffc107", borderRadius: "50%" }}></div>
            <span style={{ color: "#6d4611", fontSize: "14px" }}>
              Reservadas: {mesas.filter(m => m.estado === 'reservada').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}