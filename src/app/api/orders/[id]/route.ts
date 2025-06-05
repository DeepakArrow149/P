// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/lib/orderRepository';
import { z } from 'zod';

// Validation schema for order updates
const updateOrderSchema = z.object({
  status: z.enum(['confirmed', 'provisional', 'speculative', 'transit', 'unscheduled', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold', 'pending']).optional(),
});

// GET - Fetch single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await OrderRepository.findById(params.id);
    
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: order,
    });
    
  } catch (error) {
    console.error(`Error fetching order ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
      },
      { status: 500 }
    );
  }
}

// PATCH - Update order (mainly for status updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = updateOrderSchema.parse(body);
    
    // Check if order exists
    const existingOrder = await OrderRepository.findById(params.id);
    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }
    
    // Update order status if provided
    if (validatedData.status) {
      await OrderRepository.updateStatus(params.id, validatedData.status);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
    });
    
  } catch (error) {
    console.error(`Error updating order ${params.id}:`, error);
    
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
        error: error instanceof Error ? error.message : 'Failed to update order',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await OrderRepository.delete(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
    
  } catch (error) {
    console.error(`Error deleting order ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete order',
      },
      { status: 500 }
    );
  }
}
