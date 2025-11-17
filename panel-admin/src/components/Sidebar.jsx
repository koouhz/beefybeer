export default function Sidebar() {
  const items = [
    "Panel principal",
    "Empleados",
    "Productos",
    "Inventario",
    "Pedidos",
    "Ventas",
    "Mesas",
    "Proveedores",
    "Recetas",
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <h2>Beef & Beer</h2>
        <span>Sistema de gestión</span>
      </div>

      <ul className="menu">
        {items.map((item, index) => (
          <li key={index} className={index === 0 ? "active" : ""}>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
