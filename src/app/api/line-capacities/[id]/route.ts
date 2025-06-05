// src/app/api/line-capacities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lineCapacityRepository } from '@/lib/lineCapacityRepository';
import { persistentMockLineCapacityService } from '@/lib/persistentMockLineCapacityService';

// Validation schemas
const updateLineCapacitySchema = z.object({
  lineId: z.string().min(1, 'Line ID is required').optional(),
  orderNo: z.string().optional(),
  buyer: z.string().optional(),
  styleNo: z.string().optional(),
  garmentDescription: z.string().optional(),
  sam: z.number().min(0.01, 'SAM must be positive').optional(),
  operators: z.number().int().min(1, 'Operators must be at least 1').optional(),
  workingHours: z.number().min(0.1, 'Working hours must be positive').optional(),
  efficiency: z.number().min(1, 'Efficiency must be at least 1%').max(200, 'Efficiency cannot exceed 200%').optional(),
  effectiveFrom: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
  effectiveTo: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
  isActive: z.boolean().optional(),
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  dataSource?: string;
  message?: string;
}

// GET /api/line-capacities/[id] - Get specific line capacity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const lineCapacityId = parseInt(id, 10);
    
    if (isNaN(lineCapacityId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line capacity ID',
        },
        { status: 400 }
      );
    }
    
    // Try database first, fall back to persistent mock service
    let lineCapacity;
    let dataSource = 'database';
    
    try {
      lineCapacity = await lineCapacityRepository.getLineCapacityById(lineCapacityId);
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
      lineCapacity = await persistentMockLineCapacityService.getLineCapacityById(lineCapacityId);
      dataSource = 'mock';
    }

    if (!lineCapacity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line capacity not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lineCapacity,
      dataSource,
    });
  } catch (error) {
    console.error('Error fetching line capacity:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch line capacity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/line-capacities/[id] - Update specific line capacity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const lineCapacityId = parseInt(id, 10);
    
    if (isNaN(lineCapacityId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line capacity ID',
        },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateLineCapacitySchema.parse(body);
    
    // Try database first, fall back to persistent mock service
    let updatedLineCapacity;
    let dataSource = 'database';
    
    try {
      updatedLineCapacity = await lineCapacityRepository.updateLineCapacity(lineCapacityId, validatedData);
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
      updatedLineCapacity = await persistentMockLineCapacityService.updateLineCapacity(lineCapacityId, validatedData);
      dataSource = 'mock';
    }

    return NextResponse.json({
      success: true,
      data: updatedLineCapacity,
      dataSource,
      message: 'Line capacity updated successfully',
    });
  } catch (error) {
    console.error('Error updating line capacity:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line capacity data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line capacity not found',
          details: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && (error.message.includes('positive') || error.message.includes('range'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid capacity values',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update line capacity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/line-capacities/[id] - Delete specific line capacity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const lineCapacityId = parseInt(id, 10);
    
    if (isNaN(lineCapacityId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line capacity ID',
        },
        { status: 400 }
      );
    }
    
    // Try database first, fall back to persistent mock service
    let success;
    let dataSource = 'database';
    
    try {
      success = await lineCapacityRepository.deleteLineCapacity(lineCapacityId);
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
      success = await persistentMockLineCapacityService.deleteLineCapacity(lineCapacityId);
      dataSource = 'mock';
    }

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line capacity not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dataSource,
      message: 'Line capacity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting line capacity:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete line capacity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
