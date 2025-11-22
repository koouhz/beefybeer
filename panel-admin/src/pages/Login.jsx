import { useState, useEffect } from "react";
import { supabase } from "../bd/supabaseClient";

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    pat: "",
    mat: "",
    fecha_nac: "",
    ci: "",
    id_rol: "2" // ← Valor por defecto: 2 = Mesero
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);

  // Cargar roles cuando se muestre el formulario de registro
  useEffect(() => {
    const cargarRoles = async () => {
      if (!isLogin) {
        try {
          const { data, error } = await supabase
            .from('roles')
            .select('id_rol, nombre')
            .order('id_rol');
          
          if (error) throw error;
          setRoles(data || []);
        } catch (error) {
          console.error('Error cargando roles:', error);
        }
      }
    };
    cargarRoles();
  }, [isLogin]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Primero verificar si el usuario existe
      const { data: usuarioExistente, error: errorEmail } = await supabase
        .from('empleados')
        .select('email')
        .eq('email', formData.email)
        .single();

      // Si no existe el email
      if (errorEmail && errorEmail.code === 'PGRST116') {
        setError("No existe una cuenta con este email.");
        return;
      }

      // Si hay otro error de email
      if (errorEmail && errorEmail.code !== 'PGRST116') {
        throw errorEmail;
      }

      // Ahora verificar email y contraseña juntos
      const { data: empleado, error } = await supabase
        .from('empleados')
        .select(`
          *,
          roles (nombre)
        `)
        .eq('email', formData.email)
        .eq('password', formData.password)
        .single();

      // Si las credenciales son incorrectas
      if (error && error.code === 'PGRST116') {
        setError("Contraseña incorrecta.");
        return;
      }

      // Si hay otro error
      if (error) {
        throw error;
      }
      
      if (empleado) {
        // Determinar tipo de usuario basado en id_rol
        let tipo_usuario = 'mesero';
        
        if (empleado.id_rol === 1) {
          tipo_usuario = 'admin';
        } else if (empleado.id_rol === 2) {
          tipo_usuario = 'mesero';
        }

        const empleadoConTipo = {
          ...empleado,
          tipo_usuario: tipo_usuario,
          rol_nombre: empleado.roles?.nombre || 'Sin rol'
        };
        
        console.log("🔑 Login exitoso:", empleadoConTipo);
        localStorage.setItem('empleado', JSON.stringify(empleadoConTipo));
        onLogin(empleadoConTipo);
      }
    } catch (error) {
      console.error('Error login:', error);
      
      // Mensajes de error específicos
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError("Error de conexión. Verifica tu internet.");
      } else {
        setError("Error inesperado. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verificar si ya existe el email
      const { data: existeEmail } = await supabase
        .from('empleados')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existeEmail) {
        setError("Ya existe un usuario con este email");
        return;
      }

      // Verificar si ya existe el CI
      const { data: existeCI } = await supabase
        .from('empleados')
        .select('ci')
        .eq('ci', formData.ci)
        .single();

      if (existeCI) {
        setError("Ya existe un usuario con este CI");
        return;
      }

      const { data, error } = await supabase
        .from('empleados')
        .insert([{
          ci: formData.ci,
          nombre: formData.nombre,
          pat: formData.pat,
          mat: formData.mat,
          fecha_nac: formData.fecha_nac,
          email: formData.email,
          password: formData.password,
          id_rol: parseInt(formData.id_rol) // ← Usar id_rol en lugar de tipo_usuario
        }])
        .select(`
          *,
          roles (nombre)
        `);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const nuevoEmpleado = data[0];
        
        // Determinar tipo de usuario basado en id_rol
        let tipo_usuario = 'mesero';
        if (nuevoEmpleado.id_rol === 1) {
          tipo_usuario = 'admin';
        } else if (nuevoEmpleado.id_rol === 2) {
          tipo_usuario = 'mesero';
        }

        const empleadoCompleto = {
          ...nuevoEmpleado,
          tipo_usuario: tipo_usuario,
          rol_nombre: nuevoEmpleado.roles?.nombre || 'Sin rol'
        };
        
        console.log("✅ Registro exitoso:", empleadoCompleto);
        localStorage.setItem('empleado', JSON.stringify(empleadoCompleto));
        onLogin(empleadoCompleto);
      }
    } catch (error) {
      console.error('Error registro:', error);
      setError("Error al registrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fef5e6 0%, #f8e1c5 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(122, 59, 6, 0.1)",
        border: "1px solid #e9d8b5",
        width: "100%",
        maxWidth: "450px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{
            fontSize: "28px",
            color: "#7a3b06",
            marginBottom: "8px",
            fontWeight: "700"
          }}>
            Beef & Beer
          </h1>
          <p style={{
            color: "#6d4611",
            fontSize: "16px",
            opacity: 0.8
          }}>
            {isLogin ? "Iniciar Sesión" : "Registrar Empleado"}
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fee",
            border: "1px solid #f5c6cb",
            color: "#721c24",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Cédula de Identidad *
                </label>
                <input
                  type="text"
                  name="ci"
                  value={formData.ci}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "#fefaf5"
                  }}
                  placeholder="Ingrese su CI"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "#fefaf5"
                  }}
                  placeholder="Ingrese su nombre"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="pat"
                  value={formData.pat}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "#fefaf5"
                  }}
                  placeholder="Ingrese apellido paterno"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="mat"
                  value={formData.mat}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "#fefaf5"
                  }}
                  placeholder="Ingrese apellido materno"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="fecha_nac"
                  value={formData.fecha_nac}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "#fefaf5"
                  }}
                />
              </div>

              {/* Selector de Rol */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#7a3b06",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  Rol *
                </label>
                <select
                  name="id_rol"
                  value={formData.id_rol}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e9d8b5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#7a3b06",
                    backgroundColor: "#fefaf5"
                  }}
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map(rol => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
                <small style={{ color: "#6d4611", fontSize: "12px", display: "block", marginTop: "4px" }}>
                  * Los administradores tienen acceso completo al sistema
                </small>
              </div>
            </>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              marginBottom: "6px",
              color: "#7a3b06",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e9d8b5",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#7a3b06",
                backgroundColor: "#fefaf5"
              }}
              placeholder="Ingrese su email"
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              marginBottom: "6px",
              color: "#7a3b06",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Contraseña *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e9d8b5",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#7a3b06",
                backgroundColor: "#fefaf5"
              }}
              placeholder="Ingrese su contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#7a3b06",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginBottom: "16px"
            }}
          >
            {loading ? "Cargando..." : (isLogin ? "Iniciar Sesión" : "Registrar")}
          </button>
        </form>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({
                email: "",
                password: "",
                nombre: "",
                pat: "",
                mat: "",
                fecha_nac: "",
                ci: "",
                id_rol: "2"
              });
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#7a3b06",
              cursor: "pointer",
              fontSize: "14px",
              textDecoration: "underline"
            }}
          >
            {isLogin 
              ? "¿No tienes cuenta? Regístrate aquí" 
              : "¿Ya tienes cuenta? Inicia sesión aquí"}
          </button>
        </div>
      </div>
    </div>
  );
}