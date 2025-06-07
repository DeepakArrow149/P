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

// GET - Fetch all buyers with optional search
export async function GET(request: NextRequest) {
  try {
    await BuyerRepository.createTable();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let buyers;
    if (search) {
      buyers = await BuyerRepository.search(search);
    } else {
      buyers = await BuyerRepository.findAll();
    }
    
    return NextResponse.json({
      success: true,
      data: buyers,
      dataSource: 'database',
      count: buyers.length,
    });
  } catch (error) {
    console.error('GET /api/buyers error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch buyers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create new buyer
export async function POST(request: NextRequest) {
  try {
    await BuyerRepository.createTable();
    
    const body = await request.json();
    
    // Validate input
    const validatedData = buyerSchema.parse(body);
    
    // Check if buyer code already exists
    const existingBuyer = await BuyerRepository.findByCode(validatedData.buyerCode);
    if (existingBuyer) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Buyer code already exists' 
        },
        { status: 409 }
      );
    }
    
    // Create buyer
    const newBuyer = await BuyerRepository.create(validatedData);
    
    return NextResponse.json({ 
      success: true, 
      data: newBuyer,
      message: 'Buyer created successfully',
      source: 'database'
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/buyers error:', error);
    
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
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create buyer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
