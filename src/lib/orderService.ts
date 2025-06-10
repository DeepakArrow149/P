// src/lib/orderService.ts
import type { NewOrderFormValues } from '@/app/new-order/page';
import type { CompleteOrderData } from '@/lib/orderRepository';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// Convert CompleteOrderData to StoredOrder format for compatibility
export interface StoredOrder {
  id: string;
  orderReference: string;
  description?: string;
  product?: string;
  customer?: string;
  buyer?: string;
  styleName?: string;
  timetable?: string;
  orderSet?: string;
  salesYear?: number;
  season?: string;
  efficiency?: number;
  userStatus?: string;
  learningCurveId?: string;
  tnaTemplate?: string;
  status: 'confirmed' | 'provisional' | 'speculative' | 'transit' | 'unscheduled' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'pending';
  color?: string;
  isCompleted?: boolean;
  orderDate?: string;
  receivedDate?: string;
  launchDate?: string;
  shipDate?: string;
  contractQuantity?: number;
  distributeFrom?: string;
  deliverTo?: string;
  method?: string;
  planInGroup?: string;
  useRoute?: string;
  deliveredQuantity?: number;
  reservation?: string;
  scheduleOffset?: string;
  generalNotes?: string;
  financialNotes?: string;
  sizesNotes?: string;
  planningNotes?: string;
  materialsNotes?: string;
  eventsNotes?: string;
  userValuesNotes?: string;
  consolidatedViewNotes?: string;
  progressViewNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveryDetails: Array<{
    id: string;
    deliveryDate: string;
    quantity: number;
    reference?: string;
  }>;
  poLines: Array<{
    id: string;
    soNo?: string;
    poName?: string;
    deliveryDate?: string;
    country?: string;
    extraPercentage?: number;
    sizeQuantities: Array<{
      id: string;
      sizeName: string;
      quantity: number;
    }>;
  }>;
}

// Helper function to safely convert dates to ISO strings
function safeDateToISO(date: any): string | undefined {
  if (!date) return undefined;
  
  try {
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
    if (typeof date === 'number') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
  } catch (error) {
    console.warn('Error converting date to ISO string:', error, 'Date value:', date);
  }
  
  return undefined;
}

// Convert MySQL CompleteOrderData to StoredOrder format
function convertToStoredOrder(order: CompleteOrderData): StoredOrder {
  try {
    return {
      id: order.id,
      orderReference: order.order_reference,
      description: order.description,
      product: order.product,
      customer: order.customer,
      buyer: order.buyer,
      styleName: order.style_name,
      timetable: order.timetable,
      orderSet: order.order_set,
      salesYear: order.sales_year,
      season: order.season,
      efficiency: order.efficiency,
      userStatus: order.user_status,
      learningCurveId: order.learning_curve_id,
      tnaTemplate: order.tna_template,
      status: order.status,
      color: order.color,
      isCompleted: order.is_completed,
      orderDate: safeDateToISO(order.order_date),
      receivedDate: safeDateToISO(order.received_date),
      launchDate: safeDateToISO(order.launch_date),
      shipDate: safeDateToISO(order.ship_date),
      contractQuantity: order.contract_quantity,
      distributeFrom: order.distribute_from,
      deliverTo: order.deliver_to,
      method: order.method,
      planInGroup: order.plan_in_group,
      useRoute: order.use_route,
      deliveredQuantity: order.delivered_quantity,
      reservation: order.reservation,
      scheduleOffset: order.schedule_offset,
      generalNotes: order.general_notes,
      financialNotes: order.financial_notes,
      sizesNotes: order.sizes_notes,
      planningNotes: order.planning_notes,
      materialsNotes: order.materials_notes,
      eventsNotes: order.events_notes,
      userValuesNotes: order.user_values_notes,
      consolidatedViewNotes: order.consolidated_view_notes,
      progressViewNotes: order.progress_view_notes,
      createdAt: safeDateToISO(order.created_at),
      updatedAt: safeDateToISO(order.updated_at),
      deliveryDetails: (order.deliveryDetails || []).map(dd => ({
        id: dd.id,
        deliveryDate: safeDateToISO(dd.delivery_date) || new Date().toISOString(),
        quantity: dd.quantity || 0,
        reference: dd.reference || '',
      })),
      poLines: (order.poLines || []).map(pl => ({
        id: pl.id,
        soNo: pl.so_no || '',
        poName: pl.po_name || '',
        deliveryDate: safeDateToISO(pl.delivery_date),
        country: pl.country || '',
        extraPercentage: pl.extra_percentage || 0,
        sizeQuantities: (pl.sizeQuantities || []).map(sq => ({
          id: sq.id,
          sizeName: sq.size_name || '',
          quantity: sq.quantity || 0,
        })),
      })),
    };
  } catch (error) {
    console.error('Error in convertToStoredOrder:', error);
    console.error('Order data:', order);
    throw new Error(`Failed to convert order data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export class OrderService {
  private static baseUrl = '/api/orders';

  // Create new order
  static async addOrder(orderData: NewOrderFormValues): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result: ApiResponse<{ id: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      return result.data!.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
  // Get all orders
  static async getAllOrders(): Promise<StoredOrder[]> {
    try {
      const response = await fetch(this.baseUrl);
      const result: ApiResponse<CompleteOrderData[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      // Safely convert orders with error handling for individual orders
      const convertedOrders: StoredOrder[] = [];
      const orders = result.data || [];
      
      for (let i = 0; i < orders.length; i++) {
        try {
          const convertedOrder = convertToStoredOrder(orders[i]);
          convertedOrders.push(convertedOrder);
        } catch (conversionError) {
          console.error(`Error converting order at index ${i}:`, conversionError);
          console.error('Order data:', orders[i]);
          // Skip this order and continue with the next one
          continue;
        }
      }

      return convertedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get order by ID
  static async getOrder(id: string): Promise<StoredOrder | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (response.status === 404) {
        return null;
      }

      const result: ApiResponse<CompleteOrderData> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch order');
      }

      return convertToStoredOrder(result.data!);
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  }

  // Get unscheduled orders
  static async getUnscheduledOrders(): Promise<StoredOrder[]> {
    try {
      const response = await fetch(`${this.baseUrl}?status=unscheduled`);
      const result: ApiResponse<CompleteOrderData[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch unscheduled orders');
      }

      return result.data!.map(convertToStoredOrder);
    } catch (error) {
      console.error('Error fetching unscheduled orders:', error);
      throw error;
    }
  }

  // Update order status
  static async updateOrderStatus(id: string, status: StoredOrder['status']): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error(`Error updating order status for ${id}:`, error);
      throw error;
    }
  }

  // Update order
  static async updateOrder(id: string, data: Partial<StoredOrder>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update order');
      }
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw error;
    }
  }

  // Delete order
  static async deleteOrder(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      throw error;
    }
  }
}

// Export functions for compatibility with existing code
export const addOrder = OrderService.addOrder.bind(OrderService);
export const getAllOrders = OrderService.getAllOrders.bind(OrderService);
export const getOrder = OrderService.getOrder.bind(OrderService);
export const getUnscheduledOrders = OrderService.getUnscheduledOrders.bind(OrderService);
export const updateOrderStatus = OrderService.updateOrderStatus.bind(OrderService);
export const updateOrder = OrderService.updateOrder.bind(OrderService);
export const deleteOrder = OrderService.deleteOrder.bind(OrderService);
