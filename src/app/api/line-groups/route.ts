// src/app/api/line-groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lineGroupRepository } from '@/lib/lineGroupRepository';

// Validation schemas
const createLineGroupSchema = z.object({
  groupCode: z.string().min(1, 'Group Code is required').max(50, 'Group Code must be 50 characters or less'),
  groupName: z.string().min(1, 'Group Name is required').max(255, 'Group Name must be 255 characters or less'),
  lineIds: z.array(z.string()).default([]),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
});

const searchParamsSchema = z.object({
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
  hasLines: z.coerce.boolean().optional(),
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

// GET /api/line-groups - Get all line groups with optional filtering
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedParams = searchParamsSchema.parse(searchParams);
    
    const lineGroups = await lineGroupRepository.getLineGroups(validatedParams);    return NextResponse.json({
      success: true,
      data: lineGroups,
      dataSource: 'database',
      count: lineGroups.length,
    });
  } catch (error) {
    console.error('Error fetching line groups:', error);
    
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
        error: 'Failed to fetch line groups',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/line-groups - Create new line group
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json();
    const validatedData = createLineGroupSchema.parse(body);
    
    const newLineGroup = await lineGroupRepository.createLineGroup(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: newLineGroup,
        dataSource: 'database',
        message: 'Line group created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating line group:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line group data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line group code already exists',
          details: error.message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create line group',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
