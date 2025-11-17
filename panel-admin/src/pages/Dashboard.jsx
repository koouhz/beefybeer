import Sidebar from "../components/Sidebar";
import Card from "../components/Card";

export default function Dashboard() {
  return (
    <div className="layout" style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="content" style={{ flex: 1, padding: "25px", background: "#fdf6e3", overflowY: "auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "5px" }}>Panel principal</h1>
          <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
            Actualizado: 10 de noviembre de 2025, 23:43
          </p>
        </header>

        {/* Cards */}
        <section 
          className="cards-container" 
          style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}
        >
          <Card 
            title="Ventas del día" 
            value="0 Bs" 
            subtitle="+0% vs ayer" 
          />

          <Card 
            title="Pedidos activos" 
            value="0 en proceso" 
            subtitle="Capacidad disponible" 
          />

          <Card 
            title="Ventas de la semana" 
            value=" " 
            subtitle="Últimos 7 días" 
          />
        </section>
      </main>
    </div>
  );
}
