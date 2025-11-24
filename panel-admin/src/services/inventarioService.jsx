// src/services/inventarioService.js
import { supabase } from "../bd/supabaseClient";

export class InventarioService {
  /**
   * Actualiza el stock del inventario basado en movimientos de productos
   * @param {number} idProducto - ID del producto
   * @param {number} cantidad - Cantidad positiva para entradas, negativa para salidas
   * @param {string} tipoMovimiento - Tipo de movimiento: 'venta', 'pedido', 'compra', 'ajuste'
   * @param {string} observaciones - Observaciones del movimiento
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizarStock(idProducto, cantidad, tipoMovimiento, observaciones = '') {
    try {
      // Validaciones básicas
      if (!idProducto || cantidad === undefined || cantidad === null) {
        throw new Error('ID de producto y cantidad son requeridos');
      }

      if (cantidad === 0) {
        return { success: true, message: 'No hay cambios en el stock' };
      }

      // Obtener el registro actual de inventario para el producto
      const { data: inventarioActual, error: errorInventario } = await supabase
        .from('inventario')
        .select('*')
        .eq('id_producto', idProducto)
        .order('fecha', { ascending: false })
        .limit(1)
        .single();

      if (errorInventario && errorInventario.code !== 'PGRST116') {
        throw new Error(`Error al obtener inventario: ${errorInventario.message}`);
      }

      const fechaHoy = new Date().toISOString().split('T')[0];
      
      // Si no existe registro de inventario para hoy, crear uno nuevo
      if (!inventarioActual || inventarioActual.fecha !== fechaHoy) {
        return await this.crearNuevoRegistroInventario(
          idProducto, 
          cantidad, 
          tipoMovimiento, 
          observaciones,
          inventarioActual
        );
      } else {
        // Actualizar registro existente
        return await this.actualizarRegistroExistente(
          inventarioActual, 
          cantidad, 
          tipoMovimiento, 
          observaciones
        );
      }
    } catch (error) {
      console.error('Error en actualizarStock:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro de inventario
   */
  static async crearNuevoRegistroInventario(idProducto, cantidad, tipoMovimiento, observaciones, inventarioAnterior) {
    const stockAnterior = inventarioAnterior ? inventarioAnterior.cantidad_actual : 0;
    const nuevaCantidadActual = stockAnterior + cantidad;

    if (nuevaCantidadActual < 0) {
      throw new Error(`Stock insuficiente para el producto ${idProducto}. Stock actual: ${stockAnterior}, requerido: ${Math.abs(cantidad)}`);
    }

    const nuevoRegistro = {
      id_producto: idProducto,
      fecha: new Date().toISOString().split('T')[0],
      cantidad_actual: nuevaCantidadActual,
      entradas: cantidad > 0 ? cantidad : 0,
      salidas: cantidad < 0 ? Math.abs(cantidad) : 0,
      observaciones: `${tipoMovimiento}: ${observaciones}`.substring(0, 500)
    };

    const { data, error } = await supabase
      .from('inventario')
      .insert([nuevoRegistro])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Stock actualizado correctamente',
      data: data,
      movimiento: {
        tipo: tipoMovimiento,
        cantidad: cantidad,
        stock_anterior: stockAnterior,
        stock_actual: nuevaCantidadActual
      }
    };
  }

  /**
   * Actualiza un registro existente de inventario
   */
  static async actualizarRegistroExistente(inventarioActual, cantidad, tipoMovimiento, observaciones) {
    const nuevaCantidadActual = inventarioActual.cantidad_actual + cantidad;

    if (nuevaCantidadActual < 0) {
      throw new Error(`Stock insuficiente para el producto ${inventarioActual.id_producto}. Stock actual: ${inventarioActual.cantidad_actual}, requerido: ${Math.abs(cantidad)}`);
    }

    const actualizaciones = {
      cantidad_actual: nuevaCantidadActual,
      entradas: inventarioActual.entradas + (cantidad > 0 ? cantidad : 0),
      salidas: inventarioActual.salidas + (cantidad < 0 ? Math.abs(cantidad) : 0),
      observaciones: `${inventarioActual.observaciones || ''} | ${tipoMovimiento}: ${observaciones}`.substring(0, 500)
    };

    const { data, error } = await supabase
      .from('inventario')
      .update(actualizaciones)
      .eq('id_inventario', inventarioActual.id_inventario)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Stock actualizado correctamente',
      data: data,
      movimiento: {
        tipo: tipoMovimiento,
        cantidad: cantidad,
        stock_anterior: inventarioActual.cantidad_actual,
        stock_actual: nuevaCantidadActual
      }
    };
  }

  /**
   * Actualiza el stock para múltiples productos (transacción)
   */
  static async actualizarStockMultiple(productosMovimientos, tipoMovimiento, observaciones = '') {
    try {
      const resultados = [];

      for (const movimiento of productosMovimientos) {
        try {
          const resultado = await this.actualizarStock(
            movimiento.id_producto,
            movimiento.cantidad,
            tipoMovimiento,
            `${observaciones} - Producto: ${movimiento.id_producto}`
          );
          resultados.push({
            id_producto: movimiento.id_producto,
            success: true,
            data: resultado
          });
        } catch (error) {
          resultados.push({
            id_producto: movimiento.id_producto,
            success: false,
            error: error.message
          });
          // Si falla uno, revertir los anteriores
          await this.revertirMovimientos(resultados.filter(r => r.success));
          throw new Error(`Error en producto ${movimiento.id_producto}: ${error.message}`);
        }
      }

      return {
        success: true,
        message: 'Stock múltiple actualizado correctamente',
        resultados: resultados
      };
    } catch (error) {
      console.error('Error en actualizarStockMultiple:', error);
      throw error;
    }
  }

  /**
   * Revertir movimientos en caso de error
   */
  static async revertirMovimientos(movimientosExitosos) {
    for (const movimiento of movimientosExitosos) {
      try {
        await this.actualizarStock(
          movimiento.id_producto,
          -movimiento.data.movimiento.cantidad,
          'reversion',
          'Reversión por error en transacción'
        );
      } catch (error) {
        console.error(`Error revirtiendo movimiento para producto ${movimiento.id_producto}:`, error);
      }
    }
  }

  /**
   * Obtener stock actual de un producto
   */
  static async obtenerStockActual(idProducto) {
    const { data, error } = await supabase
      .from('inventario')
      .select('cantidad_actual')
      .eq('id_producto', idProducto)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return 0; // No existe registro, stock 0
      }
      throw error;
    }

    return data.cantidad_actual;
  }

  /**
   * Verificar disponibilidad de stock para múltiples productos
   */
  static async verificarDisponibilidad(productosRequeridos) {
    const verificaciones = [];

    for (const producto of productosRequeridos) {
      const stockActual = await this.obtenerStockActual(producto.id_producto);
      const disponible = stockActual >= producto.cantidad;
      
      verificaciones.push({
        id_producto: producto.id_producto,
        cantidad_requerida: producto.cantidad,
        stock_actual: stockActual,
        disponible: disponible,
        deficit: disponible ? 0 : producto.cantidad - stockActual
      });
    }

    const todosDisponibles = verificaciones.every(v => v.disponible);
    const productosSinStock = verificaciones.filter(v => !v.disponible);

    return {
      todosDisponibles,
      verificaciones,
      productosSinStock
    };
  }

  /**
   * Obtener historial de inventario de un producto
   */
  static async obtenerHistorialProducto(idProducto, limite = 30) {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('id_producto', idProducto)
      .order('fecha', { ascending: false })
      .limit(limite);

    if (error) throw error;

    return data || [];
  }

  /**
   * Obtener productos con stock bajo
   */
  static async obtenerProductosStockBajo() {
    const { data, error } = await supabase
      .from('inventario')
      .select(`
        *,
        productos (id_producto, nombre, precio)
      `)
      .order('fecha', { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Filtrar los registros más recientes por producto
    const productosUnicos = {};
    data.forEach(registro => {
      if (!productosUnicos[registro.id_producto]) {
        productosUnicos[registro.id_producto] = registro;
      }
    });

    // Filtrar productos con stock bajo (menos de 10 unidades)
    const productosStockBajo = Object.values(productosUnicos).filter(
      producto => producto.cantidad_actual < 10
    );

    return productosStockBajo;
  }
}