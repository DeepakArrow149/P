// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/lib/orderRepository';
import { z } from 'zod';
import type { NewOrderFormValues } from '@/app/new-order/page';

// Validation schema for order creation
const orderSchema = z.object({
  orderReference: z.string().min(1, 'Order Reference is required'),
  description: z.string().optional(),
  product: z.string().min(1, 'Product is required'),
  customer: z.string().min(1, 'Customer is required'),
  timetable: z.string().optional(),
  orderSet: z.string().optional(),
  salesYear: z.number().optional(),
  season: z.string().optional(),
  efficiency: z.number().optional(),
  userStatus: z.string().optional(),
  learningCurveId: z.string().min(1, 'Learning Curve is required'),
  tnaTemplate: z.string().min(1, 'TNA Template is required'),
  status: z.enum(['confirmed', 'provisional', 'speculative', 'transit']).default('provisional'),
  color: z.string().optional(),
  isCompleted: z.boolean().default(false),
  orderDate: z.date().optional(),
  receivedDate: z.date().optional(),
  launchDate: z.date().optional(),
  contractQuantity: z.number().optional(),
  distributeFrom: z.string().optional(),
  deliverTo: z.string().optional(),
  method: z.string().optional(),
  planInGroup: z.string().optional(),
  useRoute: z.string().optional(),
  deliveredQuantity: z.number().optional(),
  reservation: z.string().optional(),
  scheduleOffset: z.string().optional(),
  deliveryDetails: z.array(z.object({
    id: z.string(),
    deliveryDate: z.date(),
    quantity: z.number(),
    reference: z.string().optional(),
  })).min(1, 'At least one delivery detail is required'),
  poLines: z.array(z.object({
    id: z.string(),
    soNo: z.string().optional(),
    poName: z.string().optional(),
    deliveryDate: z.date(),
    country: z.string().optional(),
    extraPercentage: z.number().default(0),
    sizeQuantities: z.array(z.object({
      sizeName: z.string(),
      quantity: z.number(),
    })).min(1, 'At least one size quantity is required'),
  })).min(1, 'At least one PO line is required'),
  activeSizeNames: z.array(z.string()),
  generalNotes: z.string().optional(),
  financialNotes: z.string().optional(),
  sizesNotes: z.string().optional(),
  planningNotes: z.string().optional(),
  materialsNotes: z.string().optional(),
  eventsNotes: z.string().optional(),
  userValuesNotes: z.string().optional(),
  consolidatedViewNotes: z.string().optional(),
  progressViewNotes: z.string().optional(),
});

// GET - Fetch all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let orders;
    
    if (status === 'unscheduled') {
      orders = await OrderRepository.findUnscheduled();
    } else {
      orders = await OrderRepository.findAll();
    }
    
    return NextResponse.json({
      success: true,
      data: orders,
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert date strings back to Date objects for validation
    if (body.orderDate) body.orderDate = new Date(body.orderDate);
    if (body.receivedDate) body.receivedDate = new Date(body.receivedDate);
    if (body.launchDate) body.launchDate = new Date(body.launchDate);
    
    if (body.deliveryDetails) {
      body.deliveryDetails = body.deliveryDetails.map((dd: any) => ({
        ...dd,
        deliveryDate: new Date(dd.deliveryDate),
      }));
    }
    
    if (body.poLines) {
      body.poLines = body.poLines.map((pl: any) => ({
        ...pl,
        deliveryDate: new Date(pl.deliveryDate),
      }));
    }
    
    // Validate the request body
    const validatedData = orderSchema.parse(body);
    
    // Create order in database
    const orderId = await OrderRepository.create(validatedData as NewOrderFormValues);
    
    return NextResponse.json(
      {
        success: true,
        data: { id: orderId },
        message: 'Order created successfully',
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}
