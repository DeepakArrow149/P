// src/app/api/line-groups/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lineGroupRepository } from '@/lib/lineGroupRepository';

// Validation schemas
const updateLineGroupSchema = z.object({
  groupCode: z.string().min(1, 'Group Code is required').max(50, 'Group Code must be 50 characters or less').optional(),
  groupName: z.string().min(1, 'Group Name is required').max(255, 'Group Name must be 255 characters or less').optional(),
  lineIds: z.array(z.string()).optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
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

// GET /api/line-groups/[id] - Get specific line group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const lineGroupId = parseInt(id, 10);
      if (isNaN(lineGroupId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line group ID',
        },
        { status: 400 }
      );
    }

    // Get line group from database
    const lineGroup = await lineGroupRepository.getLineGroupById(lineGroupId);

    if (!lineGroup) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line group not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lineGroup,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching line group:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch line group',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/line-groups/[id] - Update specific line group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const lineGroupId = parseInt(id, 10);
    
    if (isNaN(lineGroupId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line group ID',
        },
        { status: 400 }
      );
    }
      const body = await request.json();
    const validatedData = updateLineGroupSchema.parse(body);
    
    // Update line group in database
    const updatedLineGroup = await lineGroupRepository.updateLineGroup(lineGroupId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedLineGroup,
      source: 'database',
      message: 'Line group updated successfully',
    });
  } catch (error) {
    console.error('Error updating line group:', error);
    
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

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line group not found',
          details: error.message,
        },
        { status: 404 }
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
        error: 'Failed to update line group',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/line-groups/[id] - Delete specific line group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const lineGroupId = parseInt(id, 10);
    
    if (isNaN(lineGroupId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid line group ID',
        },
        { status: 400 }
      );    }
      // Delete line group from database
    try {
      await lineGroupRepository.deleteLineGroup(lineGroupId);
      
      return NextResponse.json({
        success: true,
        source: 'database',
        message: 'Line group deleted successfully',
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Line group not found',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting line group:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete line group',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
