import { useState, useEffect } from "react";
import { supabase } from "../../bd/supabaseClient";
import { Plus, ShoppingCart, Clock, CheckCircle, XCircle, Search } from "lucide-react";

export default function PedidosMesero() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [showNuevoPedido, setShowNuevoPedido] = useState(false);
  const [pedidoActual, setPedidoActual] = useState({
    nromesa: '',
    productos: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [pedidosRes, productosRes, mesasRes] = await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('mesas').select('*').eq('estado', 'libre')
      ]);

      setPedidos(pedidosRes.data || []);
      setProductos(productosRes.data || []);
      setMesas(mesasRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
    setLoading(false);
  };

  const agregarProducto = (producto) => {
    const existe = pedidoActual.productos.find(p => p.id_producto === producto.id_producto);
    
    if (existe) {
      setPedidoActual(prev => ({
        ...prev,
        productos: prev.productos.map(p =>
          p.id_producto === producto.id_producto
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      }));
    } else {
      setPedidoActual(prev => ({
        ...prev,
        productos: [...prev.productos, { ...producto, cantidad: 1 }]
      }));
    }
  };

  const quitarProducto = (idProducto) => {
    setPedidoActual(prev => ({
      ...prev,
      productos: prev.productos.filter(p => p.id_producto !== idProducto)
    }));
  };

  const actualizarCantidad = (idProducto, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    
    setPedidoActual(prev => ({
      ...prev,
      productos: prev.productos.map(p =>
        p.id_producto === idProducto
          ? { ...p, cantidad: nuevaCantidad }
          : p
      )
    }));
  };

  const crearPedido = async () => {
    if (!pedidoActual.nromesa || pedidoActual.productos.length === 0) {
      alert('Selecciona una mesa y agrega productos');
      return;
    }

    try {
      const detalle = pedidoActual.productos.map(p => 
        `${p.cantidad}x ${p.nombre} - Bs. ${(p.precio * p.cantidad).toFixed(2)}`
      ).join('\n');

      const { error } = await supabase
        .from('pedidos')
        .insert([{
          nromesa: pedidoActual.nromesa,
          detalle: detalle
        }]);

      if (error) throw error;

      // Actualizar estado de la mesa
      await supabase
        .from('mesas')
        .update({ estado: 'ocupada' })
        .eq('nromesa', pedidoActual.nromesa);

      setPedidoActual({ nromesa: '', productos: [] });
      setShowNuevoPedido(false);
      cargarDatos();
      
      alert('Pedido creado exitosamente!');
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert('Error al crear el pedido');
    }
  };

  // FUNCIONES NUEVAS PARA COMPLETAR Y CANCELAR PEDIDOS
  const completarPedido = async (idPedido, nromesa) => {
    if (window.confirm('¿Marcar pedido como completado?')) {
      try {
        // Crear una venta antes de eliminar el pedido
        const pedido = pedidos.find(p => p.id_pedido === idPedido);
        
        // Calcular el total del pedido
        const total = calcularTotalPedido(pedido.detalle);
        
        // Insertar en ventas
        const { error: errorVenta } = await supabase
          .from('ventas')
          .insert([{
            descripcion: `Venta del pedido #${idPedido}`,
            id_pedido: idPedido,
            monto_total: total
          }]);

        if (errorVenta) throw errorVenta;

        // Eliminar el pedido
        const { error } = await supabase
          .from('pedidos')
          .delete()
          .eq('id_pedido', idPedido);

        if (error) throw error;

        // Liberar la mesa
        await supabase
          .from('mesas')
          .update({ estado: 'libre' })
          .eq('nromesa', nromesa);

        cargarDatos();
        alert('Pedido completado y registrado como venta exitosamente!');
      } catch (error) {
        console.error('Error completando pedido:', error);
        alert('Error al completar el pedido');
      }
    }
  };

  const cancelarPedido = async (idPedido, nromesa) => {
    if (window.confirm('¿Cancelar este pedido?')) {
      try {
        const { error } = await supabase
          .from('pedidos')
          .delete()
          .eq('id_pedido', idPedido);

        if (error) throw error;

        // Liberar la mesa
        await supabase
          .from('mesas')
          .update({ estado: 'libre' })
          .eq('nromesa', nromesa);

        cargarDatos();
        alert('Pedido cancelado exitosamente!');
      } catch (error) {
        console.error('Error cancelando pedido:', error);
        alert('Error al cancelar el pedido');
      }
    }
  };

  // Función auxiliar para calcular el total del pedido desde el detalle
  const calcularTotalPedido = (detalle) => {
    if (!detalle) return 0;
    
    const lineas = detalle.split('\n');
    let total = 0;
    
    lineas.forEach(linea => {
      const match = linea.match(/Bs\.\s*([\d.]+)/);
      if (match) {
        total += parseFloat(match[1]);
      }
    });
    
    return total;
  };

  const getTotalPedido = () => {
    return pedidoActual.productos.reduce((total, producto) => {
      return total + (producto.precio * producto.cantidad);
    }, 0);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#7a3b06" }}>
        Cargando pedidos...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "28px", color: "#7a3b06", marginBottom: "8px" }}>
              Gestión de Pedidos
            </h1>
            <p style={{ color: "#6d4611", fontSize: "14px", opacity: 0.9 }}>
              Crea y administra pedidos en tiempo real
            </p>
          </div>
          
          <button
            onClick={() => setShowNuevoPedido(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#7a3b06",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            <Plus size={18} />
            Nuevo Pedido
          </button>
        </div>
      </header>

      {/* Modal Nuevo Pedido */}
      {showNuevoPedido && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "30px",
            width: "100%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#7a3b06", margin: 0 }}>Nuevo Pedido</h2>
              <button
                onClick={() => {
                  setShowNuevoPedido(false);
                  setPedidoActual({ nromesa: '', productos: [] });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7a3b06",
                  cursor: "pointer",
                  fontSize: "20px"
                }}
              >
                ✕
              </button>
            </div>

            {/* Selección de Mesa */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#7a3b06", fontWeight: "500" }}>
                Seleccionar Mesa *
              </label>
              <select
                value={pedidoActual.nromesa}
                onChange={(e) => setPedidoActual(prev => ({ ...prev, nromesa: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#7a3b06"
                }}
              >
                <option value="">Selecciona una mesa</option>
                {mesas.map(mesa => (
                  <option key={mesa.nromesa} value={mesa.nromesa}>
                    Mesa {mesa.nromesa} (Salón {mesa.salon}) - {mesa.capacidad} personas
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de Productos */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Productos Disponibles</h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
                maxHeight: "200px",
                overflow: "auto",
                padding: "10px",
                border: "1px solid #e9d8b5",
                borderRadius: "6px"
              }}>
                {productos.map(producto => (
                  <div
                    key={producto.id_producto}
                    style={{
                      padding: "10px",
                      border: "1px solid #e9d8b5",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onClick={() => agregarProducto(producto)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f5ee";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    <div style={{ fontWeight: "500", color: "#7a3b06" }}>{producto.nombre}</div>
                    <div style={{ fontSize: "12px", color: "#6d4611" }}>Bs. {producto.precio}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Productos Seleccionados */}
            {pedidoActual.productos.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ color: "#7a3b06", marginBottom: "15px" }}>Productos del Pedido</h3>
                <div style={{ border: "1px solid #e9d8b5", borderRadius: "6px", padding: "15px" }}>
                  {pedidoActual.productos.map(producto => (
                    <div
                      key={producto.id_producto}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f0f0f0"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "500", color: "#7a3b06" }}>{producto.nombre}</div>
                        <div style={{ fontSize: "12px", color: "#6d4611" }}>
                          Bs. {producto.precio} x {producto.cantidad} = Bs. {(producto.precio * producto.cantidad).toFixed(2)}
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <button
                            onClick={() => actualizarCantidad(producto.id_producto, producto.cantidad - 1)}
                            style={{
                              padding: "2px 6px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: "30px", textAlign: "center" }}>{producto.cantidad}</span>
                          <button
                            onClick={() => actualizarCantidad(producto.id_producto, producto.cantidad + 1)}
                            style={{
                              padding: "2px 6px",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          onClick={() => quitarProducto(producto.id_producto)}
                          style={{
                            padding: "5px 8px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ 
                    marginTop: "15px", 
                    paddingTop: "15px", 
                    borderTop: "2px solid #e9d8b5",
                    fontWeight: "bold",
                    color: "#7a3b06",
                    fontSize: "16px"
                  }}>
                    Total: Bs. {getTotalPedido().toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowNuevoPedido(false);
                  setPedidoActual({ nromesa: '', productos: [] });
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={crearPedido}
                disabled={!pedidoActual.nromesa || pedidoActual.productos.length === 0}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  opacity: (!pedidoActual.nromesa || pedidoActual.productos.length === 0) ? 0.5 : 1
                }}
              >
                Crear Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Pedidos Activos */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e9d8b5",
        padding: "20px"
      }}>
        <h2 style={{ color: "#7a3b06", marginBottom: "20px" }}>Pedidos Activos</h2>
        
        {pedidos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6d4611" }}>
            <ShoppingCart size={48} color="#e9d8b5" style={{ marginBottom: "10px" }} />
            <p>No hay pedidos activos</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {pedidos.map(pedido => (
              <div
                key={pedido.id_pedido}
                style={{
                  padding: "15px",
                  border: "1px solid #e9d8b5",
                  borderRadius: "8px",
                  background: "#f8f5ee"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ color: "#7a3b06", margin: "0 0 8px 0" }}>
                      Pedido #{pedido.id_pedido} - Mesa {pedido.nromesa}
                    </h4>
                    <pre style={{ 
                      color: "#6d4611", 
                      fontSize: "12px", 
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit"
                    }}>
                      {pedido.detalle}
                    </pre>
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => completarPedido(pedido.id_pedido, pedido.nromesa)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Completar
                    </button>
                    <button
                      onClick={() => cancelarPedido(pedido.id_pedido, pedido.nromesa)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}