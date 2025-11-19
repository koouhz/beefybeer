import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Key, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

// --- Supabase Client Placeholder ---
// IMPORTANTE: DEBES reemplazar TODO este objeto 'supabase' por la importación real
// de tu archivo Supabase si quieres que funcione con tu base de datos real.
// Importación real: import { supabase } from "../../bd/supabaseClient"; 
const supabase = {
    auth: {
        // Simula el inicio de sesión. Permite cualquier email con 6+ caracteres de contraseña.
        signInWithPassword: async ({ email, password }) => {
            console.log(`Supabase Auth: Intentando iniciar sesión con ${email}`);
            if (password.length >= 6) {
                // Simulación de éxito, devuelve un objeto user para que App.jsx detecte la sesión.
                return { data: { user: { id: 'user-auth-123', email } }, error: null };
            }
            // Simulación de error (contraseña corta o credenciales incorrectas)
            return { data: null, error: { message: "Credenciales de inicio de sesión inválidas." } };
        },
        // Simula el registro.
        signUp: async ({ email, password }) => {
            console.log(`Supabase Auth: Intentando registrar a ${email}`);
            if (email && password.length >= 6) {
                return { data: { user: { id: 'user-auth-456', email } }, error: null };
            }
            return { data: null, error: { message: "El email o la contraseña no cumplen los requisitos." } };
        }
    },
    // Simula la interacción con la base de datos (DB)
    from: (tableName) => ({
        // Simula la inserción de datos en la tabla de empleados
        insert: async (data) => {
            console.log(`Supabase DB: Insertando nuevo empleado en ${tableName}:`, data);
            // Simulación de validación de CI
            if (data.ci.length < 5) {
                return { data: null, error: { message: "La C.I. debe ser válida." } };
            }
            // Simulación de inserción exitosa
            return { data: data, error: null };
        }
    })
};
// --- END Supabase Client Placeholder ---

// Estilos basados en la paleta del Dashboard (Café y Beige)
const colors = {
    primary: '#7a3b06',    // Café oscuro
    secondary: '#6d4611',  // Café más claro
    accent: '#e9d8b5',     // Beige claro para bordes/fondo
    white: '#ffffff',
    danger: '#dc3545',
    success: '#28a745',
    inputBg: '#fdfbf7',    // Fondo de input muy claro
};

// Componente de Mensaje personalizado (sin usar alert)
const CustomMessage = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'error' ? '#f8d7da' : '#d4edda';
    const borderColor = type === 'error' ? colors.danger : colors.success;
    const textColor = type === 'error' ? colors.danger : colors.success;
    const Icon = type === 'error' ? AlertTriangle : TrendingUp;

    return (
        <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            backgroundColor: bgColor,
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontWeight: '600'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} />
                <span>{message}</span>
            </div>
            <button 
                onClick={onClose} 
                style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: textColor,
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: '1',
                    padding: '0 5px'
                }}
            >&times;</button>
        </div>
    );
};

// Componente principal del formulario de Autenticación
function AuthForm() {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    // Campos adicionales para el registro de empleados
    const [ci, setCi] = useState('');
    const [nombre, setNombre] = useState('');
    const [pat, setPat] = useState('');
    const [mat, setMat] = useState('');
    const [fechaNac, setFechaNac] = useState('');

    const resetMessage = () => setMessage('');

    // --- Funciones de Manejo de Supabase ---

    const handleLogin = async (e) => {
        e.preventDefault();
        resetMessage();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);
        if (error) {
            setMessage(`Error de Login: ${error.message}`);
            setMessageType('error');
        } else {
            // Este mensaje solo se muestra si el login simulado es exitoso. 
            // La redirección real se maneja en App.jsx.
            setMessage(`¡Bienvenido de nuevo, ${data.user.email}! Iniciando sesión...`);
            setMessageType('success');
            console.log('Usuario autenticado con éxito:', data.user);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        resetMessage();

        // 1. Validaciones básicas de campos del empleado
        if (!ci || !nombre || !pat || !fechaNac) {
            setMessage("Por favor, complete todos los campos requeridos (*).");
            setMessageType('error');
            return;
        }

        setLoading(true);

        // 2. Crear usuario en Supabase Auth
        // En el mock, solo se verifica que email exista y password tenga 6 caracteres.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setLoading(false);
            setMessage(`Error de Registro de Usuario: ${authError.message}`);
            setMessageType('error');
            return;
        }

        // 3. Insertar registro en la tabla 'empleados'
        const newEmployee = {
            ci,
            nombre,
            pat,
            mat: mat || null, 
            fecha_nac: fechaNac,
            // Asignar roles y cargos por defecto 
            id_rol: 1, 
            id_cargo: 1, 
        };

        // En el mock, solo se verifica que la C.I. tenga más de 5 caracteres
        const { error: dbError } = await supabase
            .from('empleados')
            .insert(newEmployee);
        
        setLoading(false);

        if (dbError) {
            setMessage(`Error al registrar empleado en DB: ${dbError.message}. El usuario de autenticación fue creado, pero contacte al administrador.`);
            setMessageType('error');
        } else {
            setMessage(`Registro y perfil de empleado creado con éxito para ${email}. ¡Ya puedes iniciar sesión!`);
            setMessageType('success');
            setIsLoginMode(true); // Redirigir a login
            // Limpiar campos de registro
            setCi(''); setNombre(''); setPat(''); setMat(''); setFechaNac('');
        }
    };

    // --- Renderizado de Componentes ---

    const renderInput = (Icon, type, placeholder, value, setter, required = true, isFullWidth = true) => (
        <div 
            key={placeholder}
            style={{ 
                marginBottom: '15px', 
                flexGrow: isFullWidth ? 1 : 0, 
                minWidth: isFullWidth ? '250px' : 'auto' 
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.accent}`,
                borderRadius: '8px',
                padding: '10px 12px',
                transition: 'border-color 0.2s'
            }}>
                <Icon size={20} style={{ color: colors.secondary, marginRight: '10px' }} />
                <input
                    type={type}
                    placeholder={required ? `${placeholder} *` : placeholder}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required={required}
                    disabled={loading}
                    style={{
                        border: 'none',
                        outline: 'none',
                        flexGrow: 1,
                        backgroundColor: 'transparent',
                        color: colors.primary,
                        fontSize: '16px',
                        padding: '0'
                    }}
                />
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.accent,
            fontFamily: 'Inter, sans-serif',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: colors.white,
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: isLoginMode ? '400px' : '800px',
                transition: 'max-width 0.4s ease-in-out',
                border: `1px solid ${colors.accent}`,
            }}>
                <h2 style={{
                    fontSize: '28px',
                    color: colors.primary,
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: '10px'
                }}>
                    {isLoginMode ? 'Bienvenido a Beef & Beer' : 'Registro de Nuevo Empleado'}
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: colors.secondary,
                    marginBottom: '30px',
                    fontSize: '15px'
                }}>
                    {isLoginMode ? 'Inicie sesión para acceder al panel.' : 'Complete sus datos y credenciales.'}
                </p>

                <CustomMessage message={message} type={messageType} onClose={resetMessage} />

                <form onSubmit={isLoginMode ? handleLogin : handleRegister}>

                    {/* --- Credenciales de Autenticación (Email y Password) --- */}
                    {renderInput(Mail, 'email', 'Correo Electrónico', email, setEmail)}
                    {renderInput(Lock, 'password', 'Contraseña', password, setPassword)}
                    
                    {/* --- Campos de Registro de Empleados --- */}
                    {!isLoginMode && (
                        <>
                            <h3 style={{
                                fontSize: '20px',
                                color: colors.primary,
                                fontWeight: '600',
                                marginTop: '20px',
                                marginBottom: '15px',
                                borderTop: `1px solid ${colors.accent}`,
                                paddingTop: '15px'
                            }}>
                                Datos Personales
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '15px 30px'
                            }}>
                                {/* CI */}
                                {renderInput(Key, 'text', 'C.I.', ci, setCi, true, false)}
                                {/* Fecha de Nacimiento */}
                                {renderInput(Calendar, 'date', 'Fecha de Nacimiento', fechaNac, setFechaNac, true, false)}
                                {/* Nombre */}
                                {renderInput(User, 'text', 'Nombre', nombre, setNombre, true, true)}
                                {/* Apellido Paterno */}
                                {renderInput(User, 'text', 'Apellido Paterno (PAT)', pat, setPat, true, true)}
                                {/* Apellido Materno */}
                                {renderInput(User, 'text', 'Apellido Materno (MAT)', mat, setMat, false, true)}
                            </div>
                        </>
                    )}
                    
                    {/* Botón de Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            backgroundColor: colors.primary,
                            color: colors.white,
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '18px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '20px',
                            transition: 'background-color 0.3s ease',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading 
                            ? (isLoginMode ? 'Iniciando Sesión...' : 'Registrando...')
                            : (isLoginMode ? 'Iniciar Sesión' : 'Registrar y Crear Perfil')
                        }
                    </button>
                </form>

                {/* Switch de modo */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '25px', 
                    fontSize: '14px', 
                    color: colors.secondary 
                }}>
                    {isLoginMode ? (
                        <span>
                            ¿Eres nuevo por aquí? 
                            <button 
                                onClick={() => setIsLoginMode(false)}
                                style={{
                                    marginLeft: '5px',
                                    color: colors.primary,
                                    fontWeight: '600',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Crear una cuenta
                            </button>
                        </span>
                    ) : (
                        <span>
                            ¿Ya tienes una cuenta?
                            <button 
                                onClick={() => setIsLoginMode(true)}
                                style={{
                                    marginLeft: '5px',
                                    color: colors.primary,
                                    fontWeight: '600',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Iniciar Sesión
                            </button>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// Dado que App.jsx ya importa Login.jsx y lo usa para renderizar, 
// este componente principal debe ser la forma exportada.
export default AuthForm; 

// Nota: Anteriormente exportaba una función 'App' con boilerplate, 
// pero en tu estructura 'Login.jsx' es el componente de página en 'pages/'.
// Por lo tanto, solo exportamos el formulario de autenticación.