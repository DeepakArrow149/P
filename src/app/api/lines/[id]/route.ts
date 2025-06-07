// src/app/api/lines/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lineRepository } from '@/lib/lineRepository';

// Validation schemas
const updateLineSchema = z.object({
  lineCode: z.string().min(1, 'Line Code is required').max(20, 'Line Code must be 20 characters or less').optional(),
  lineName: z.string().min(1, 'Line Name is required').max(100, 'Line Name must be 100 characters or less').optional(),
  unitId: z.string().min(1, 'Unit is required').optional(),
  lineType: z.enum(['Sewing', 'Cutting', 'Finishing', 'Assembly', 'Packing', 'Other']).optional(),
  defaultCapacity: z.number().min(0, 'Capacity must be non-negative').optional(),
  notes: z.string().max(250, 'Notes must be 250 characters or less').optional(),
});

// GET /api/lines/[id] - Get specific line
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {  try {
    const { id } = await params;
    
    const line = await lineRepository.findById(id);

    if (!line) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: line,
      dataSource: 'database',
    });
  } catch (error) {
    console.error('Error fetching line:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch line',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/lines/[id] - Update specific line
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLineSchema.parse(body);
    
    const updatedLine = await lineRepository.update(id, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedLine,
      dataSource: 'database',
      message: 'Line updated successfully',
    });
  } catch (error) {
    console.error('Error updating line:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line not found',
          details: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line code already exists',
          details: error.message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update line',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/lines/[id] - Delete specific line
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {    const { id } = await params;
    
    const deleted = await lineRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dataSource: 'database',
      message: 'Line deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting line:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete line',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
