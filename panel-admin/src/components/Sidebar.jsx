import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Home, Shield, DollarSign, Users, Package, 
  UtensilsCrossed, Receipt, ShoppingCart, Truck, 
  Wallet, Menu, X, LogOut, Eye, EyeOff,
  UserCheck, AlertCircle, Settings
} from "lucide-react";

// Importa tu logo - ajusta la ruta según donde tengas tu imagen
import logo from '../logo/images.jpg'; // Ajusta esta ruta

export default function Sidebar({ onLogout, empleado }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  // Definición de permisos por rol
  const rolePermissions = {
    administrador: [
      "Panel principal", "Roles y cargos", "Sueldos", "Personal", 
      "Inventario", "Productos", "Mesas", "Pedidos", "Ventas", "Proveedores", "Gastos"
    ],
    cajero: [
      "Panel principal", "Ventas", "Gastos"
    ],
    mesero: [
      "Panel principal", "Mesas", "Pedidos"
    ],
    usuario: [
      "Panel principal"
    ]
  };

  // Todos los permisos disponibles en el sistema
  const allPermissions = [
    "Panel principal", "Roles y cargos", "Sueldos", "Personal", 
    "Inventario", "Productos", "Mesas", "Pedidos", "Ventas", "Proveedores", "Gastos"
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Items del menú con permisos
  const menuItems = [
    { 
      label: "Panel principal", 
      icon: Home, 
      path: "/",
      roles: ["administrador", "cajero", "mesero", "usuario"],
      description: "Dashboard y estadísticas"
    },
    { 
      label: "Roles y cargos", 
      icon: Shield, 
      path: "/roles-cargos",
      roles: ["administrador"],
      description: "Gestión de permisos y puestos"
    },
    { 
      label: "Sueldos", 
      icon: DollarSign, 
      path: "/sueldos",
      roles: ["administrador"],
      description: "Administración de salarios"
    },
    { 
      label: "Personal", 
      icon: Users, 
      path: "/personal",
      roles: ["administrador"],
      description: "Gestión de empleados"
    },
    { 
      label: "Inventario", 
      icon: Package, 
      path: "/inventario",
      roles: ["administrador"],
      description: "Control de stock y productos"
    },
    { 
      label: "Productos", 
      icon: ShoppingCart, 
      path: "/productos",
      roles: ["administrador"],
      description: "Gestión de productos del menú"
    },
    { 
      label: "Mesas", 
      icon: UtensilsCrossed, 
      path: "/mesas",
      roles: ["administrador", "mesero"],
      description: "Gestión de mesas y salones"
    },
    { 
      label: "Pedidos", 
      icon: Receipt, 
      path: "/pedidos",
      roles: ["administrador", "mesero"],
      description: "Tomar y gestionar pedidos"
    },
    { 
      label: "Ventas", 
      icon: ShoppingCart, 
      path: "/ventas",
      roles: ["administrador", "cajero"],
      description: "Registro y control de ventas"
    },
    { 
      label: "Proveedores", 
      icon: Truck, 
      path: "/proveedores",
      roles: ["administrador"],
      description: "Gestión de proveedores"
    },
    { 
      label: "Gastos", 
      icon: Wallet, 
      path: "/gastos",
      roles: ["administrador", "cajero"],
      description: "Control de egresos y gastos"
    },
  ];

  // Función para obtener el rol del empleado
  const getEmpleadoRol = () => {
    if (!empleado) return "usuario";
    
    if (empleado.roles && empleado.roles.nombre) {
      return empleado.roles.nombre.toLowerCase();
    }
    
    if (empleado.rol) {
      return empleado.rol.toLowerCase();
    }
    
    if (empleado.id_rol) {
      const rolMap = {
        1: "administrador",
        2: "cajero", 
        3: "mesero",
        4: "usuario"
      };
      return rolMap[empleado.id_rol] || "usuario";
    }
    
    return "usuario";
  };

  const empleadoRol = getEmpleadoRol();

  // Filtrar items según el rol del usuario
  const filteredItems = menuItems.filter(item => 
    item.roles.includes(empleadoRol)
  );

  // Obtener permisos NO disponibles para este rol
  const getUnavailablePermissions = () => {
    const availablePerms = rolePermissions[empleadoRol] || [];
    return allPermissions.filter(perm => !availablePerms.includes(perm));
  };

  const unavailablePermissions = getUnavailablePermissions();

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      onLogout();
    }
  };

  const getRoleColor = (roleName) => {
    const colors = {
      administrador: "#dc3545",
      cajero: "#28a745", 
      mesero: "#ffc107",
      usuario: "#6c757d"
    };
    return colors[roleName] || "#6c757d";
  };

  const getRoleBadge = (roleName) => {
    const badges = {
      administrador: "ADM",
      cajero: "CAJ",
      mesero: "MES",
      usuario: "USR"
    };
    return badges[roleName] || "USR";
  };

  // Estilos en objetos JavaScript
  const styles = {
    sidebarLoading: {
      width: "250px",
      height: "100vh",
      background: "linear-gradient(145deg, #f7dca1, #f2c786)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    loadingContent: {
      textAlign: "center",
      color: "#7a3b06"
    },
    loadingSpinner: {
      width: "30px",
      height: "30px",
      border: "3px solid rgba(122, 59, 6, 0.2)",
      borderTop: "3px solid #7a3b06",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      margin: "0 auto 15px"
    },
    mobileMenuButton: {
      position: "fixed",
      top: "20px",
      left: "20px",
      zIndex: 1001,
      background: "#7a3b06",
      color: "white",
      border: "none",
      borderRadius: "8px",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      transition: "all 0.3s ease"
    },
    sidebarOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 998
    },
    sidebar: {
      width: "280px",
      height: "100vh",
      background: "linear-gradient(145deg, #f7dca1, #f2c786)",
      padding: "25px 20px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
      position: "relative",
      zIndex: 999,
      overflow: "hidden"
    },
    sidebarMobile: {
      position: "fixed",
      left: "-280px",
      top: 0,
      transition: "left 0.3s ease"
    },
    sidebarOpen: {
      left: 0
    }
  };

  // Agregar estilos globales para las animaciones
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Si no hay empleado, mostrar estado de carga
  if (!empleado) {
    return (
      <aside style={styles.sidebarLoading}>
        <div style={styles.loadingContent}>
          <div style={styles.loadingSpinner}></div>
          <p>Cargando información...</p>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Botón móvil del menú */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={styles.mobileMenuButton}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Overlay para móvil */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={styles.sidebarOverlay}
        />
      )}

      {/* Sidebar principal */}
      <aside 
        style={{
          ...styles.sidebar,
          ...(isMobile ? styles.sidebarMobile : {}),
          ...(isOpen ? styles.sidebarOpen : {})
        }}
      >
        {/* Header del Sidebar */}
        <div style={sidebarStyles.header}>
          {/* Logo minimalista */}
          <div style={sidebarStyles.logoContainer}>
            <img 
              src={logo} 
              alt="Beef & Beer Logo" 
              style={sidebarStyles.logoImage}
              onError={(e) => {
                // Fallback si la imagen no carga
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback en caso de que la imagen no cargue */}
            <div style={sidebarStyles.logoFallback}>
              B&B
            </div>
          </div>
          
          <div style={sidebarStyles.brandSection}>
            <h2 style={sidebarStyles.brandTitle}>Beef & Beer</h2>
            <span style={sidebarStyles.brandSubtitle}>Sistema de gestión</span>
          </div>
          
          {/* Información del usuario */}
          <div style={sidebarStyles.userInfo}>
            <div style={sidebarStyles.userAvatar}>
              <UserCheck size={16} />
            </div>
            <div style={sidebarStyles.userDetails}>
              <p style={sidebarStyles.userName}>
                {empleado.nombre} {empleado.pat}
                {empleado.mat && ` ${empleado.mat}`}
              </p>
              <div style={sidebarStyles.userRoleSection}>
                <span 
                  style={{
                    ...sidebarStyles.userRoleBadge,
                    backgroundColor: getRoleColor(empleadoRol)
                  }}
                  title={`Rol: ${empleadoRol}`}
                >
                  {getRoleBadge(empleadoRol)}
                </span>
                <button 
                  style={sidebarStyles.roleInfoButton}
                  onClick={() => setShowRoleInfo(!showRoleInfo)}
                  title="Ver información de permisos"
                >
                  {showRoleInfo ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Información de permisos del rol - ACTUALIZADO */}
          {showRoleInfo && (
            <div style={sidebarStyles.rolePermissionsInfo}>
              {/* Permisos disponibles (VERDE) */}
              <div>
                <div style={sidebarStyles.permissionsHeader}>
                  <Settings size={14} />
                  <span>Permisos disponibles - {empleadoRol.toUpperCase()}</span>
                </div>
                <ul style={sidebarStyles.permissionsList}>
                  {rolePermissions[empleadoRol]?.map((permiso, index) => (
                    <li key={`available-${index}`} style={sidebarStyles.permissionItem}>
                      <div style={sidebarStyles.permissionDotAvailable}></div>
                      <span style={sidebarStyles.permissionTextAvailable}>{permiso}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Permisos NO disponibles (ROJO) */}
              {unavailablePermissions.length > 0 && (
                <div style={sidebarStyles.unavailableSection}>
                  <div style={sidebarStyles.permissionsHeader}>
                    <AlertCircle size={14} />
                    <span>Permisos restringidos</span>
                  </div>
                  <ul style={sidebarStyles.permissionsList}>
                    {unavailablePermissions.map((permiso, index) => (
                      <li key={`unavailable-${index}`} style={sidebarStyles.permissionItem}>
                        <div style={sidebarStyles.permissionDotUnavailable}></div>
                        <span style={sidebarStyles.permissionTextUnavailable}>{permiso}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav style={sidebarStyles.sidebarNav}>
          {filteredItems.length === 0 ? (
            <div style={sidebarStyles.noPermissions}>
              <AlertCircle size={32} style={sidebarStyles.noPermissionsIcon} />
              <p style={sidebarStyles.noPermissionsTitle}>Sin permisos</p>
              <p style={sidebarStyles.noPermissionsDescription}>
                Tu rol de usuario no tiene acceso a las funciones del sistema.
              </p>
            </div>
          ) : (
            <ul style={sidebarStyles.navList}>
              {filteredItems.map((item, index) => {
                const active = location.pathname === item.path;
                const IconComponent = item.icon;
                
                return (
                  <li
                    key={index}
                    style={{
                      ...sidebarStyles.navItem,
                      ...(active ? sidebarStyles.navItemActive : {})
                    }}
                  >
                    <Link
                      to={item.path}
                      style={sidebarStyles.navLink}
                      onClick={() => isMobile && setIsOpen(false)}
                      title={item.description}
                    >
                      <span style={sidebarStyles.navIcon}>
                        <IconComponent size={16} />
                      </span>
                      <span style={sidebarStyles.navLabel}>
                        {item.label}
                      </span>
                      {active && <div style={sidebarStyles.navIndicator} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Botón de Cerrar Sesión */}
        <div style={sidebarStyles.sidebarFooter}>
          <button
            onClick={handleLogout}
            style={sidebarStyles.logoutButton}
            title="Cerrar sesión del sistema"
          >
            <span style={sidebarStyles.logoutIcon}>
              <LogOut size={16} />
            </span>
            <span>Cerrar Sesión</span>
          </button>

          {/* Footer */}
          <div style={sidebarStyles.sidebarCopyright}>
            © 2025 Beef & Beer
            <span style={sidebarStyles.version}>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

// Estilos CSS en objetos JavaScript
const sidebarStyles = {
  header: {
    marginBottom: "25px",
    flexShrink: 0
  },
  logoContainer: {
    position: "relative",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center"
  },
  logoImage: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #7a3b06",
    boxShadow: "0 4px 12px rgba(122, 59, 6, 0.2)",
    transition: "all 0.3s ease",
    cursor: "pointer"
  },
  logoFallback: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7a3b06, #a85a1a)",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    color: "#f7dca1",
    fontSize: "18px",
    fontWeight: "bold",
    border: "3px solid #7a3b06",
    boxShadow: "0 4px 12px rgba(122, 59, 6, 0.2)"
  },
  brandSection: {
    textAlign: "center",
    marginBottom: "20px"
  },
  brandTitle: {
    margin: "0 0 4px 0",
    fontSize: "22px",
    fontWeight: 700,
    color: "#7a3b06"
  },
  brandSubtitle: {
    fontSize: "13px",
    color: "#6d4611",
    opacity: 0.9
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    background: "rgba(122, 59, 6, 0.08)",
    borderRadius: "12px",
    border: "1px solid rgba(122, 59, 6, 0.1)"
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: "rgba(122, 59, 6, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7a3b06",
    flexShrink: 0
  },
  userDetails: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    margin: "0 0 6px 0",
    fontSize: "14px",
    fontWeight: 600,
    color: "#7a3b06",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  userRoleSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  userRoleBadge: {
    padding: "2px 8px",
    borderRadius: "12px",
    color: "white",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase"
  },
  roleInfoButton: {
    background: "none",
    border: "none",
    color: "#6d4611",
    cursor: "pointer",
    padding: "2px",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  rolePermissionsInfo: {
    marginTop: "15px",
    padding: "15px",
    background: "rgba(255, 255, 255, 0.6)",
    borderRadius: "8px",
    border: "1px solid rgba(122, 59, 6, 0.1)",
    maxHeight: "300px",
    overflowY: "auto"
  },
  unavailableSection: {
    marginTop: "15px",
    paddingTop: "15px",
    borderTop: "1px solid rgba(220, 53, 69, 0.2)"
  },
  permissionsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#7a3b06"
  },
  permissionsList: {
    listStyle: "none",
    padding: 0,
    margin: 0
  },
  permissionItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 0",
    fontSize: "11px",
    color: "#6d4611"
  },
  permissionDotAvailable: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#28a745",
    flexShrink: 0
  },
  permissionDotUnavailable: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#dc3545",
    flexShrink: 0
  },
  permissionTextAvailable: {
    color: "#28a745",
    fontWeight: 500
  },
  permissionTextUnavailable: {
    color: "#dc3545",
    fontWeight: 500
  },
  sidebarNav: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: "5px"
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0
  },
  navItem: {
    marginBottom: "6px",
    borderRadius: "10px",
    overflow: "hidden",
    transition: "all 0.25s ease",
    background: "transparent",
    position: "relative",
    cursor: "pointer"
  },
  navItemActive: {
    background: "linear-gradient(135deg, #f7dca1, #e6b85c)",
    color: "#7a3b06",
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(122, 59, 6, 0.15)"
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    color: "inherit",
    textDecoration: "none",
    fontSize: "14px",
    transition: "all 0.25s ease",
    position: "relative"
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "rgba(122, 59, 6, 0.08)",
    transition: "all 0.25s ease",
    flexShrink: 0
  },
  navLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  navIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "3px",
    background: "#7a3b06",
    borderRadius: "0 2px 2px 0"
  },
  noPermissions: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6d4611"
  },
  noPermissionsIcon: {
    opacity: 0.5,
    marginBottom: "15px"
  },
  noPermissionsTitle: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: 600,
    color: "#7a3b06"
  },
  noPermissionsDescription: {
    margin: 0,
    fontSize: "13px",
    opacity: 0.7,
    lineHeight: 1.4
  },
  sidebarFooter: {
    marginTop: "15px",
    flexShrink: 0
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "12px 16px",
    background: "rgba(122, 59, 6, 0.08)",
    border: "1px solid rgba(122, 59, 6, 0.2)",
    borderRadius: "10px",
    color: "#7a3b06",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.25s ease"
  },
  logoutIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "rgba(122, 59, 6, 0.12)"
  },
  sidebarCopyright: {
    fontSize: "12px",
    color: "#6d4611",
    textAlign: "center",
    opacity: 0.8,
    padding: "15px 0 5px",
    borderTop: "1px solid rgba(122, 59, 6, 0.1)",
    marginTop: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  version: {
    fontSize: "10px",
    opacity: 0.6
  }
};