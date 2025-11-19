import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom"; // Importar useNavigate
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import RolesCargos from "./pages/RolesCargos";
import Sueldos from "./pages/Sueldos";
import Personal from "./pages/Personal";
import Inventario from "./pages/Inventario";
import Login from "./pages/Login"; // Asegúrate de que este es el path correcto a tu formulario de autenticación

// --- Mock de Supabase para la Simulación de Autenticación ---
// Este mock simula el comportamiento de Supabase para manejar el estado de sesión.
const supabase = {
    auth: {
        // Simula la función que se usa para escuchar los cambios de estado de sesión
        onAuthStateChange: (callback) => {
            // Inicialmente, no hay usuario
            const initialSession = { user: null };
            
            // Simula el mecanismo de escucha
            const listener = (event, session) => {
                callback(event, session);
            };

            // Creamos un trigger global para que Login.jsx pueda "simular" un inicio de sesión
            // y forzar la actualización del listener aquí en App.jsx.
            window.mockAuthTrigger = (user) => {
                const session = user ? { user } : { user: null };
                // Usamos 'SIGNED_IN' o 'SIGNED_OUT' para simular los eventos de Supabase
                listener(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
            };

            // Llamada inicial para establecer el estado
            listener('INITIAL_SESSION', initialSession);

            // Devuelve una función de desuscripción (simulada)
            return { data: { subscription: { unsubscribe: () => console.log('Mock auth listener unsubscribed') } } };
        },
        // Función de cierre de sesión simulada (usada en Layout/Sidebar)
        signOut: async () => {
            console.log('Mock Supabase: Cerrando sesión.');
            window.mockAuthTrigger(null); // Notifica a App.jsx que la sesión terminó
            return { error: null };
        }
    },
    // Añade el método from si es necesario, pero solo el auth es crucial aquí
    from: () => ({ select: async () => ({ data: [], error: null }) })
};
// Exportar el mock para que Layout y Sidebar puedan usar el signOut
export const authService = supabase.auth;
// --- END Mock de Supabase ---


function App() {
  // 'user' almacena el objeto de usuario autenticado o null
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  // Hook para la navegación programática dentro de React Router
  const navigate = useNavigate();

  // 1. Efecto para escuchar los cambios de estado de autenticación
  useEffect(() => {
    // Escucha los cambios de estado (login, logout)
    const { data: authListener } = authService.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        // Desactivamos la carga una vez que tenemos el estado inicial
        setLoading(false); 

        // Lógica de Redirección (usando navigate)
        if (event === 'SIGNED_IN' && newUser) {
            // Redirige al dashboard
            navigate('/', { replace: true }); 
        } else if (event === 'SIGNED_OUT' && !newUser) {
            // Redirige al login
            navigate('/login', { replace: true }); 
        }
      }
    );

    // Limpieza: desuscribirse cuando el componente se desmonte
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Manejador de éxito de Login (llamado desde Login.jsx)
  // Esta función es vital para comunicar el éxito del login a App.jsx
  const handleLoginSuccess = (userData) => {
    // Usa el mockAuthTrigger para notificar al listener de App.jsx que el usuario ha iniciado sesión.
    if (userData) {
      window.mockAuthTrigger(userData);
    }
  };

  if (loading) {
    // Muestra una pantalla de carga mientras se verifica la sesión inicial
    return (
        <div style={{
            minHeight: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: '24px',
            color: '#7a3b06',
            backgroundColor: '#fdf6e3'
        }}>
            Verificando sesión...
        </div>
    );
  }

  // 2. Renderizado Condicional de Rutas
  return (
    <Routes>
      {/* La ruta de login se define primero y siempre es accesible */}
      <Route 
          path="/login" 
          element={<Login onLoginSuccess={handleLoginSuccess} />} 
      />

      {/* Si hay un usuario logueado (user es true), muestra las rutas de la aplicación */}
      {user ? (
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="roles-cargos" element={<RolesCargos />} />
          <Route path="sueldos" element={<Sueldos />} />
          <Route path="personal" element={<Personal />} />
          <Route path="inventario" element={<Inventario />} />
          {/* Si está logueado, cualquier otra ruta va al Dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Route>
      ) : (
        // Si no hay usuario y el path no es /login, cualquier intento va al login
        <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      )}
    </Routes>
  );
}

export default App;