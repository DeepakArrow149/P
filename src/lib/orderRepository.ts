// src/lib/orderRepository.ts
import { getTransactionConnection, getConnection } from './database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { NewOrderFormValues } from '@/app/new-order/page';
import { randomUUID } from 'crypto';

// Define interfaces for database operations
export interface OrderData {
  id: string;
  order_reference: string;
  description?: string;
  product?: string;
  customer?: string;
  buyer?: string;
  style_name?: string;
  timetable?: string;
  order_set?: string;
  sales_year?: number;
  season?: string;
  efficiency?: number;
  user_status?: string;
  learning_curve_id?: string;
  tna_template?: string;
  status: 'confirmed' | 'provisional' | 'speculative' | 'transit' | 'unscheduled' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'pending';
  color?: string;
  is_completed?: boolean;
  order_date?: Date;
  received_date?: Date;
  launch_date?: Date;
  ship_date?: Date;
  contract_quantity?: number;
  distribute_from?: string;
  deliver_to?: string;
  method?: string;
  plan_in_group?: string;
  use_route?: string;
  delivered_quantity?: number;
  reservation?: string;
  schedule_offset?: string;
  general_notes?: string;
  financial_notes?: string;
  sizes_notes?: string;
  planning_notes?: string;
  materials_notes?: string;
  events_notes?: string;
  user_values_notes?: string;
  consolidated_view_notes?: string;
  progress_view_notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DeliveryDetailData {
  id: string;
  order_id: string;
  delivery_date: Date;
  quantity: number;
  reference?: string;
}

export interface PoLineData {
  id: string;
  order_id: string;
  so_no?: string;
  po_name?: string;
  delivery_date?: Date;
  country?: string;
  extra_percentage?: number;
}

export interface SizeQuantityData {
  id: string;
  po_line_id: string;
  size_name: string;
  quantity: number;
}

export interface CompleteOrderData extends OrderData {
  deliveryDetails: DeliveryDetailData[];
  poLines: (PoLineData & { sizeQuantities: SizeQuantityData[] })[];
}

export class OrderRepository {  // Create a new order with all related data
  static async create(orderData: NewOrderFormValues): Promise<string> {
    const connection = await getTransactionConnection();
    
    try {
      await connection.beginTransaction();
      
      const orderId = randomUUID();
      
      // Insert main order record
      const insertOrderQuery = `
        INSERT INTO orders (
          id, order_reference, description, product, customer, buyer, style_name,
          timetable, order_set, sales_year, season, efficiency, user_status,
          learning_curve_id, tna_template, status, color, is_completed,
          order_date, received_date, launch_date, ship_date,
          contract_quantity, distribute_from, deliver_to, method,
          plan_in_group, use_route, delivered_quantity, reservation, schedule_offset,
          general_notes, financial_notes, sizes_notes, planning_notes,
          materials_notes, events_notes, user_values_notes,
          consolidated_view_notes, progress_view_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute<ResultSetHeader>(insertOrderQuery, [
        orderId,
        orderData.orderReference,
        orderData.description || null,
        orderData.product || null,
        orderData.customer || null,
        orderData.customer || null, // Use customer as buyer for now
        orderData.product || null, // Use product as style_name for now
        orderData.timetable || null,
        orderData.orderSet || null,
        orderData.salesYear || null,
        orderData.season || null,
        orderData.efficiency || null,
        orderData.userStatus || null,
        orderData.learningCurveId || null,
        orderData.tnaTemplate || null,
        orderData.status || 'provisional',
        orderData.color || '#FFFFFF',
        orderData.isCompleted || false,        orderData.orderDate || null,
        orderData.receivedDate || null,
        null, // launch_date - not in form schema
        null, // ship_date - will be derived from delivery details
        orderData.contractQuantity || null,
        orderData.distributeFrom || null,
        orderData.deliverTo || null,
        orderData.method || null,
        orderData.planInGroup || null,
        orderData.useRoute || null,
        orderData.deliveredQuantity || null,
        orderData.reservation || null,
        orderData.scheduleOffset || null,
        orderData.generalNotes || null,
        orderData.financialNotes || null,
        orderData.sizesNotes || null,
        orderData.planningNotes || null,
        orderData.materialsNotes || null,
        orderData.eventsNotes || null,
        orderData.userValuesNotes || null,
        orderData.consolidatedViewNotes || null,
        orderData.progressViewNotes || null,
      ]);
      
      // Insert delivery details
      for (const delivery of orderData.deliveryDetails) {
        const deliveryId = randomUUID();
        const insertDeliveryQuery = `
          INSERT INTO delivery_details (id, order_id, delivery_date, quantity, reference)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        await connection.execute<ResultSetHeader>(insertDeliveryQuery, [
          deliveryId,
          orderId,
          delivery.deliveryDate,
          delivery.quantity,
          delivery.reference || null,
        ]);
      }
      
      // Insert PO lines and size quantities
      for (const poLine of orderData.poLines) {
        const poLineId = randomUUID();
        const insertPoLineQuery = `
          INSERT INTO po_lines (id, order_id, so_no, po_name, delivery_date, country, extra_percentage)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute<ResultSetHeader>(insertPoLineQuery, [
          poLineId,
          orderId,
          poLine.soNo || null,
          poLine.poName || null,
          poLine.deliveryDate || null,
          poLine.country || null,
          poLine.extraPercentage || 0,
        ]);
        
        // Insert size quantities for this PO line
        for (const sizeQty of poLine.sizeQuantities) {
          const sizeQuantityId = randomUUID();
          const insertSizeQtyQuery = `
            INSERT INTO size_quantities (id, po_line_id, size_name, quantity)
            VALUES (?, ?, ?, ?)
          `;
          
          await connection.execute<ResultSetHeader>(insertSizeQtyQuery, [
            sizeQuantityId,
            poLineId,
            sizeQty.sizeName,
            sizeQty.quantity || 0,
          ]);
        }
      }
        await connection.commit();
      return orderId;
      
    } catch (error) {
      await connection.rollback();
      console.error('Error creating order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
    // Get all orders with related data
  static async findAll(): Promise<CompleteOrderData[]> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          o.*,
          dd.id as delivery_id, dd.delivery_date, dd.quantity as delivery_quantity, dd.reference as delivery_reference,
          pl.id as po_line_id, pl.so_no, pl.po_name, pl.delivery_date as po_delivery_date, pl.country, pl.extra_percentage,
          sq.id as size_qty_id, sq.size_name, sq.quantity as size_quantity
        FROM orders o
        LEFT JOIN delivery_details dd ON o.id = dd.order_id
        LEFT JOIN po_lines pl ON o.id = pl.order_id
        LEFT JOIN size_quantities sq ON pl.id = sq.po_line_id
        ORDER BY o.created_at DESC, dd.delivery_date, pl.delivery_date
      `;      
      const [rows] = await connection.execute<RowDataPacket[]>(query);
      
      // Group the results by order
      const ordersMap = new Map<string, CompleteOrderData>();
    
    rows.forEach(row => {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          id: row.id,
          order_reference: row.order_reference,
          description: row.description,
          product: row.product,
          customer: row.customer,
          buyer: row.buyer,
          style_name: row.style_name,
          timetable: row.timetable,
          order_set: row.order_set,
          sales_year: row.sales_year,
          season: row.season,
          efficiency: row.efficiency,
          user_status: row.user_status,
          learning_curve_id: row.learning_curve_id,
          tna_template: row.tna_template,
          status: row.status,
          color: row.color,
          is_completed: row.is_completed,
          order_date: row.order_date,
          received_date: row.received_date,
          launch_date: row.launch_date,
          ship_date: row.ship_date,
          contract_quantity: row.contract_quantity,
          distribute_from: row.distribute_from,
          deliver_to: row.deliver_to,
          method: row.method,
          plan_in_group: row.plan_in_group,
          use_route: row.use_route,
          delivered_quantity: row.delivered_quantity,
          reservation: row.reservation,
          schedule_offset: row.schedule_offset,
          general_notes: row.general_notes,
          financial_notes: row.financial_notes,
          sizes_notes: row.sizes_notes,
          planning_notes: row.planning_notes,
          materials_notes: row.materials_notes,
          events_notes: row.events_notes,
          user_values_notes: row.user_values_notes,
          consolidated_view_notes: row.consolidated_view_notes,
          progress_view_notes: row.progress_view_notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deliveryDetails: [],
          poLines: [],
        });
      }
      
      const order = ordersMap.get(row.id)!;
      
      // Add delivery detail if exists and not already added
      if (row.delivery_id && !order.deliveryDetails.find(dd => dd.id === row.delivery_id)) {
        order.deliveryDetails.push({
          id: row.delivery_id,
          order_id: row.id,
          delivery_date: row.delivery_date,
          quantity: row.delivery_quantity,
          reference: row.delivery_reference,
        });
      }
      
      // Add PO line if exists and not already added
      if (row.po_line_id && !order.poLines.find(pl => pl.id === row.po_line_id)) {
        order.poLines.push({
          id: row.po_line_id,
          order_id: row.id,
          so_no: row.so_no,
          po_name: row.po_name,
          delivery_date: row.po_delivery_date,
          country: row.country,
          extra_percentage: row.extra_percentage,
          sizeQuantities: [],
        });
      }
      
      // Add size quantity if exists
      if (row.size_qty_id && row.po_line_id) {
        const poLine = order.poLines.find(pl => pl.id === row.po_line_id);
        if (poLine && !poLine.sizeQuantities.find(sq => sq.id === row.size_qty_id)) {
          poLine.sizeQuantities.push({
            id: row.size_qty_id,
            po_line_id: row.po_line_id,
            size_name: row.size_name,
            quantity: row.size_quantity,
          });
        }      }
    });    
    return Array.from(ordersMap.values());
    } finally {
      connection.release(); 
    }
  }
  
  // Get order by ID
  static async findById(id: string): Promise<CompleteOrderData | null> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          o.*,
          dd.id as delivery_id, dd.delivery_date, dd.quantity as delivery_quantity, dd.reference as delivery_reference,
          pl.id as po_line_id, pl.so_no, pl.po_name, pl.delivery_date as po_delivery_date, pl.country, pl.extra_percentage,
          sq.id as size_qty_id, sq.size_name, sq.quantity as size_quantity
        FROM orders o
        LEFT JOIN delivery_details dd ON o.id = dd.order_id
        LEFT JOIN po_lines pl ON o.id = pl.order_id
      LEFT JOIN size_quantities sq ON pl.id = sq.po_line_id
      WHERE o.id = ?
      ORDER BY dd.delivery_date, pl.delivery_date
    `;
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) return null;
    
    // Build the complete order data from the joined results
    const firstRow = rows[0];
    const order: CompleteOrderData = {
      id: firstRow.id,
      order_reference: firstRow.order_reference,
      description: firstRow.description,
      product: firstRow.product,
      customer: firstRow.customer,
      buyer: firstRow.buyer,
      style_name: firstRow.style_name,
      timetable: firstRow.timetable,
      order_set: firstRow.order_set,
      sales_year: firstRow.sales_year,
      season: firstRow.season,
      efficiency: firstRow.efficiency,
      user_status: firstRow.user_status,
      learning_curve_id: firstRow.learning_curve_id,
      tna_template: firstRow.tna_template,
      status: firstRow.status,
      color: firstRow.color,
      is_completed: firstRow.is_completed,
      order_date: firstRow.order_date,
      received_date: firstRow.received_date,
      launch_date: firstRow.launch_date,
      ship_date: firstRow.ship_date,
      contract_quantity: firstRow.contract_quantity,
      distribute_from: firstRow.distribute_from,
      deliver_to: firstRow.deliver_to,
      method: firstRow.method,
      plan_in_group: firstRow.plan_in_group,
      use_route: firstRow.use_route,
      delivered_quantity: firstRow.delivered_quantity,
      reservation: firstRow.reservation,
      schedule_offset: firstRow.schedule_offset,
      general_notes: firstRow.general_notes,
      financial_notes: firstRow.financial_notes,
      sizes_notes: firstRow.sizes_notes,
      planning_notes: firstRow.planning_notes,
      materials_notes: firstRow.materials_notes,
      events_notes: firstRow.events_notes,
      user_values_notes: firstRow.user_values_notes,
      consolidated_view_notes: firstRow.consolidated_view_notes,
      progress_view_notes: firstRow.progress_view_notes,
      created_at: firstRow.created_at,
      updated_at: firstRow.updated_at,
      deliveryDetails: [],
      poLines: [],
    };
    
    // Group delivery details and PO lines
    const deliveryDetailsMap = new Map();
    const poLinesMap = new Map();
    
    rows.forEach(row => {
      // Add delivery detail
      if (row.delivery_id && !deliveryDetailsMap.has(row.delivery_id)) {
        deliveryDetailsMap.set(row.delivery_id, {
          id: row.delivery_id,
          order_id: row.id,
          delivery_date: row.delivery_date,
          quantity: row.delivery_quantity,
          reference: row.delivery_reference,
        });
      }
      
      // Add PO line
      if (row.po_line_id && !poLinesMap.has(row.po_line_id)) {
        poLinesMap.set(row.po_line_id, {
          id: row.po_line_id,
          order_id: row.id,
          so_no: row.so_no,
          po_name: row.po_name,
          delivery_date: row.po_delivery_date,
          country: row.country,
          extra_percentage: row.extra_percentage,
          sizeQuantities: [],
        });
      }
      
      // Add size quantity
      if (row.size_qty_id && row.po_line_id) {
        const poLine = poLinesMap.get(row.po_line_id);
        if (poLine && !poLine.sizeQuantities.find((sq: any) => sq.id === row.size_qty_id)) {
          poLine.sizeQuantities.push({
            id: row.size_qty_id,
            po_line_id: row.po_line_id,
            size_name: row.size_name,
            quantity: row.size_quantity,
          });
        }
      }
    });
      order.deliveryDetails = Array.from(deliveryDetailsMap.values());
    order.poLines = Array.from(poLinesMap.values());
    
    return order;
    } finally {
      connection.release();
    }
  }
    // Update order status
  static async updateStatus(id: string, status: OrderData['status']): Promise<void> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Order not found');
      }
    } finally {
      connection.release();
    }
  }
    // Get unscheduled orders
  static async findUnscheduled(): Promise<CompleteOrderData[]> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          o.*,
          dd.id as delivery_id, dd.delivery_date, dd.quantity as delivery_quantity, dd.reference as delivery_reference,
          pl.id as po_line_id, pl.so_no, pl.po_name, pl.delivery_date as po_delivery_date, pl.country, pl.extra_percentage,
          sq.id as size_qty_id, sq.size_name, sq.quantity as size_quantity
        FROM orders o
        LEFT JOIN delivery_details dd ON o.id = dd.order_id
        LEFT JOIN po_lines pl ON o.id = pl.order_id
        LEFT JOIN size_quantities sq ON pl.id = sq.po_line_id
        WHERE o.status IN ('unscheduled', 'provisional')
        ORDER BY o.created_at DESC, dd.delivery_date, pl.delivery_date
      `;
      
      const [rows] = await connection.execute<RowDataPacket[]>(query);
    
    // Group the results by order (same logic as findAll)
    const ordersMap = new Map<string, CompleteOrderData>();
    
    rows.forEach(row => {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          id: row.id,
          order_reference: row.order_reference,
          description: row.description,
          product: row.product,
          customer: row.customer,
          buyer: row.buyer,
          style_name: row.style_name,
          timetable: row.timetable,
          order_set: row.order_set,
          sales_year: row.sales_year,
          season: row.season,
          efficiency: row.efficiency,
          user_status: row.user_status,
          learning_curve_id: row.learning_curve_id,
          tna_template: row.tna_template,
          status: row.status,
          color: row.color,
          is_completed: row.is_completed,
          order_date: row.order_date,
          received_date: row.received_date,
          launch_date: row.launch_date,
          ship_date: row.ship_date,
          contract_quantity: row.contract_quantity,
          distribute_from: row.distribute_from,
          deliver_to: row.deliver_to,
          method: row.method,
          plan_in_group: row.plan_in_group,
          use_route: row.use_route,
          delivered_quantity: row.delivered_quantity,
          reservation: row.reservation,
          schedule_offset: row.schedule_offset,
          general_notes: row.general_notes,
          financial_notes: row.financial_notes,
          sizes_notes: row.sizes_notes,
          planning_notes: row.planning_notes,
          materials_notes: row.materials_notes,
          events_notes: row.events_notes,
          user_values_notes: row.user_values_notes,
          consolidated_view_notes: row.consolidated_view_notes,
          progress_view_notes: row.progress_view_notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deliveryDetails: [],
          poLines: [],
        });
      }
      
      const order = ordersMap.get(row.id)!;
      
      // Add delivery detail if exists and not already added
      if (row.delivery_id && !order.deliveryDetails.find(dd => dd.id === row.delivery_id)) {
        order.deliveryDetails.push({
          id: row.delivery_id,
          order_id: row.id,
          delivery_date: row.delivery_date,
          quantity: row.delivery_quantity,
          reference: row.delivery_reference,
        });
      }
      
      // Add PO line if exists and not already added
      if (row.po_line_id && !order.poLines.find(pl => pl.id === row.po_line_id)) {
        order.poLines.push({
          id: row.po_line_id,
          order_id: row.id,
          so_no: row.so_no,
          po_name: row.po_name,
          delivery_date: row.po_delivery_date,
          country: row.country,
          extra_percentage: row.extra_percentage,
          sizeQuantities: [],
        });
      }
      
      // Add size quantity if exists
      if (row.size_qty_id && row.po_line_id) {
        const poLine = order.poLines.find(pl => pl.id === row.po_line_id);
        if (poLine && !poLine.sizeQuantities.find(sq => sq.id === row.size_qty_id)) {
          poLine.sizeQuantities.push({
            id: row.size_qty_id,
            po_line_id: row.po_line_id,
            size_name: row.size_name,
            quantity: row.size_quantity,
          });
        }
      }    });
    
    return Array.from(ordersMap.values());
    } finally {
      connection.release();
    }
  }
  
  // Delete order
  static async delete(id: string): Promise<boolean> {
    const connection = await getTransactionConnection();
    
    try {
      await connection.beginTransaction();
      
      // Delete size quantities first (foreign key constraint)
      await connection.execute('DELETE sq FROM size_quantities sq JOIN po_lines pl ON sq.po_line_id = pl.id WHERE pl.order_id = ?', [id]);
      
      // Delete po lines
      await connection.execute('DELETE FROM po_lines WHERE order_id = ?', [id]);
      
      // Delete delivery details
      await connection.execute('DELETE FROM delivery_details WHERE order_id = ?', [id]);
      
      // Delete main order
      const [result] = await connection.execute<ResultSetHeader>('DELETE FROM orders WHERE id = ?', [id]);
        await connection.commit();
      return result.affectedRows > 0;
      
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
