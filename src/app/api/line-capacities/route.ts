// src/app/api/line-capacities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lineCapacityRepository } from '@/lib/lineCapacityRepository';
import { persistentMockLineCapacityService } from '@/lib/persistentMockLineCapacityService';

// Validation schemas
const createLineCapacitySchema = z.object({
  lineId: z.string().min(1, 'Line ID is required'),
  orderNo: z.string().optional(),
  buyer: z.string().optional(),
  styleNo: z.string().optional(),
  garmentDescription: z.string().optional(),
  sam: z.number().min(0.01, 'SAM must be positive'),
  operators: z.number().int().min(1, 'Operators must be at least 1'),
  workingHours: z.number().min(0.1, 'Working hours must be positive'),
  efficiency: z.number().min(1, 'Efficiency must be at least 1%').max(200, 'Efficiency cannot exceed 200%'),
  effectiveFrom: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
  effectiveTo: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
});

const searchParamsSchema = z.object({
  search: z.string().optional(),
  lineId: z.string().optional(),
  buyer: z.string().optional(),
  active: z.coerce.boolean().optional(),
  effectiveDate: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  dataSource?: string;
  count?: number;
  message?: string;
}

// GET /api/line-capacities - Get all line capacities with optional filtering
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedParams = searchParamsSchema.parse(searchParams);
    
    // Try database first, fall back to persistent mock service
    let lineCapacities;
    let dataSource = 'database';
    
    try {
      lineCapacities = await lineCapacityRepository.getLineCapacities(validatedParams);
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
      lineCapacities = await persistentMockLineCapacityService.getLineCapacities(validatedParams);
      dataSource = 'mock';
    }

    return NextResponse.json({
      success: true,
      data: lineCapacities,
      dataSource,
      count: lineCapacities.length,
    });
  } catch (error) {
    console.error('Error fetching line capacities:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch line capacities',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/line-capacities - Create new line capacity
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json();
    const validatedData = createLineCapacitySchema.parse(body);
    
    // Try database first, fall back to persistent mock service
    let newLineCapacity;
    let dataSource = 'database';
    
    try {
      newLineCapacity = await lineCapacityRepository.createLineCapacity(validatedData);
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
      newLineCapacity = await persistentMockLineCapacityService.createLineCapacity(validatedData);
      dataSource = 'mock';
    }

    return NextResponse.json(
      {
        success: true,
        data: newLineCapacity,
        dataSource,
        message: 'Line capacity created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating line capacity:', error);
    
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
        error: 'Failed to create line capacity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
