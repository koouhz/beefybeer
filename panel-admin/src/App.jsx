// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import RolesCargos from "./pages/RolesCargos";
import Sueldos from "./pages/Sueldos";
import Personal from "./pages/Personal";
import Inventario from "./pages/Inventario";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="roles-cargos" element={<RolesCargos />} />
        <Route path="sueldos" element={<Sueldos />} />
        <Route path="personal" element={<Personal />} />
        <Route path="inventario" element={<Inventario />} />
      </Route>
    </Routes>
  );
}

export default App;
