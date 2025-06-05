// src/app/api/lines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lineRepository } from '@/lib/lineRepository';

// Validation schemas
const createLineSchema = z.object({
  lineCode: z.string().min(1, 'Line Code is required').max(20, 'Line Code must be 20 characters or less'),
  lineName: z.string().min(1, 'Line Name is required').max(100, 'Line Name must be 100 characters or less'),
  unitId: z.string().min(1, 'Unit is required'),
  lineType: z.enum(['Sewing', 'Cutting', 'Finishing', 'Assembly', 'Packing', 'Other']).optional(),
  defaultCapacity: z.number().min(0, 'Capacity must be non-negative').optional(),
  notes: z.string().max(250, 'Notes must be 250 characters or less').optional(),
});

const searchParamsSchema = z.object({
  search: z.string().optional(),
  unitId: z.string().optional(),
  lineType: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
});

// GET /api/lines - Get all lines with optional filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedParams = searchParamsSchema.parse(searchParams);
    
    const lines = await lineRepository.findMany(validatedParams);

    return NextResponse.json({
      success: true,
      data: lines,
      dataSource: 'database',
      count: lines.length,
    });
  } catch (error) {
    console.error('Error fetching lines:', error);
    
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
        error: 'Failed to fetch lines',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/lines - Create new line
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLineSchema.parse(body);
    
    const newLine = await lineRepository.create(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: newLine,
        dataSource: 'database',
        message: 'Line created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating line:', error);
    
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
        error: 'Failed to create line',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
