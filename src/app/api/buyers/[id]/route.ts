import { NextRequest, NextResponse } from 'next/server';
import { BuyerRepository } from '@/lib/buyerRepository';
import { z } from 'zod';

// Validation schema
const buyerSchema = z.object({
  buyerCode: z.string().min(1, 'Buyer Code is required').max(20, 'Code must be 20 chars or less'),
  buyerName: z.string().min(1, 'Buyer Name is required').max(100, 'Name must be 100 chars or less'),
  contactPerson: z.string().max(50, 'Contact must be 50 chars or less').optional().default(''),
  email: z.string().email('Invalid email address').max(100, 'Email must be 100 chars or less').optional().default(''),
  phone: z.string().max(20, 'Phone must be 20 chars or less').optional().default(''),
  address: z.string().max(250, 'Address must be 250 chars or less').optional().default(''),
  country: z.string().max(50, 'Country must be 50 chars or less').optional().default(''),
});

interface RouteParams {
  params: { id: string };
}

// GET - Fetch buyer by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await BuyerRepository.createTable();
    
    const buyer = await BuyerRepository.findById(id);
    
    if (!buyer) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Buyer not found' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: buyer,
      source: 'database'
    });  } catch (error) {
    console.error(`GET /api/buyers/${params.id} error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch buyer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update buyer
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = buyerSchema.parse(body);
    
    // Check if buyer code already exists for another buyer
    const codeExists = await BuyerRepository.codeExists(validatedData.buyerCode, id);
    if (codeExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Buyer code already exists' 
        },
        { status: 409 }
      );
    }
    
    // Update buyer
    const updatedBuyer = await BuyerRepository.update(id, validatedData);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedBuyer,
      message: 'Buyer updated successfully',
      source: 'database'
    });} catch (error) {
    console.error(`PUT /api/buyers/${(await params).id} error:`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && (error.message === 'Buyer not found' || error.message.includes('already exists'))) {
      const status = error.message === 'Buyer not found' ? 404 : 409;
      return NextResponse.json(
        { 
          success: false, 
          error: error.message
        },
        { status }
      );    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update buyer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete buyer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const deleted = await BuyerRepository.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Buyer not found' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Buyer deleted successfully',
      source: 'database'
    });  } catch (error) {
    console.error(`DELETE /api/buyers/${(await params).id} error:`, error);
    
    if (error instanceof Error && error.message === 'Buyer not found') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Buyer not found' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete buyer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
