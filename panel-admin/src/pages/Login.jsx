import { useState } from "react";
import { supabase } from "../bd/supabaseClient";
import { Eye, EyeOff, AlertTriangle, CheckCircle, X } from "lucide-react";

// Función para hashear contraseñas (usando SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados para la contraseña
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validar campos requeridos
      if (!formData.email.trim() || !formData.password.trim()) {
        throw new Error("Por favor ingrese email y contraseña");
      }

      // Primero buscar el usuario por email
      const { data: empleado, error: queryError } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (queryError) {
        // Si no encuentra el usuario
        if (queryError.code === 'PGRST116') {
          throw new Error("Email o contraseña incorrectos");
        }
        throw queryError;
      }

      if (!empleado) {
        throw new Error("Email o contraseña incorrectos");
      }

      // Verificar la contraseña (compatibilidad con contraseñas existentes y nuevas hasheadas)
      let passwordMatch = false;

      // Si la contraseña en la BD está hasheada (64 caracteres = SHA-256)
      if (empleado.password && empleado.password.length === 64) {
        const hashedPassword = await hashPassword(formData.password);
        passwordMatch = (empleado.password === hashedPassword);
      } else {
        // Si la contraseña en la BD no está hasheada (contraseñas existentes)
        passwordMatch = (empleado.password === formData.password);
      }

      if (passwordMatch) {
        setSuccess("Inicio de sesión exitoso");
        localStorage.setItem('empleado', JSON.stringify(empleado));
        setTimeout(() => onLogin(empleado), 1000);
      } else {
        setError("Email o contraseña incorrectos");
      }

    } catch (error) {
      // Manejar específicamente el error de credenciales incorrectas
      if (error.message.includes("incorrectos") || error.message.includes("PGRST116")) {
        setError("Email o contraseña incorrectos");
      } else {
        setError("Error al iniciar sesión: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: ""
    });
    setShowPassword(false);
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
        maxWidth: "400px"
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
            Iniciar Sesión
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
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button 
              onClick={() => setError("")} 
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                marginLeft: "auto"
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {success && (
          <div style={{
            background: "#f0fff4",
            border: "1px solid #c3e6cb",
            color: "#155724",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <CheckCircle size={16} />
            <span>{success}</span>
            <button 
              onClick={() => setSuccess("")} 
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                marginLeft: "auto"
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleLogin}>
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
              maxLength={100}
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
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 12px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#7a3b06",
                  backgroundColor: "#fefaf5"
                }}
                placeholder="Ingrese su contraseña"
                maxLength={50}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6d4611",
                  opacity: 0.7
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: loading ? "#6c757d" : "#7a3b06",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginBottom: "16px",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{
            color: "#6d4611",
            fontSize: "12px",
            opacity: 0.7
          }}>
            Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}