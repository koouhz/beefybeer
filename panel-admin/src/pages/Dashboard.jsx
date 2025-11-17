import Sidebar from "../components/Sidebar";
import Card from "../components/Card";

export default function Dashboard() {
  return (
    <div className="layout">
      <Sidebar />

      <main className="content">
        <header>
          <h1>Panel principal</h1>
          <p>Actualizado: 10 de noviembre de 2025, 23:43</p>
        </header>

        <section className="cards-container">
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
