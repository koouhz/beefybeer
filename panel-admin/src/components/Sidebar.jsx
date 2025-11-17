import { useState } from "react";
import {
  Home,
  Shield,
  DollarSign,
  Users,
  Package,
  UtensilsCrossed,
  Receipt,
  ShoppingCart,
  Truck,
  BookOpen,
  Wallet,
} from "lucide-react";

export default function Sidebar() {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    { label: "Panel principal", icon: <Home size={18} /> },
    { label: "Roles y cargos", icon: <Shield size={18} /> },
    { label: "Sueldos", icon: <DollarSign size={18} /> },
    { label: "Personal", icon: <Users size={18} /> },
    { label: "Inventario", icon: <Package size={18} /> },
    { label: "Mesas", icon: <UtensilsCrossed size={18} /> },
    { label: "Pedidos", icon: <Receipt size={18} /> },
    { label: "Ventas", icon: <ShoppingCart size={18} /> },
    { label: "Proveedores", icon: <Truck size={18} /> },
    { label: "Recetas", icon: <BookOpen size={18} /> },
    { label: "Gastos", icon: <Wallet size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <h2>Beef & Beer</h2>
        <span>Sistema de gestión</span>
      </div>

      <ul className="menu">
        {items.map((item, index) => (
          <li
            key={index}
            className={`menu-item ${activeIndex === index ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
