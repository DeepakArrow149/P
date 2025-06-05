# Master Module Database Integration Guide

## Overview

This guide provides a comprehensive framework for implementing database connectivity for master modules in the Next.js React production planning application. It follows the established patterns from the buyer and line master implementations and serves as a template for future master module integrations.

## Implementation Pattern

All master modules follow a consistent 4-layer architecture:

1. **Database Layer**: Repository classes for data access
2. **API Layer**: RESTful endpoints with validation
3. **Frontend Layer**: React hooks and UI components
4. **Fallback Layer**: Mock services for offline operation

## Step-by-Step Implementation Guide

### Step 1: Database Schema Design

#### Schema Template
```sql
CREATE TABLE IF NOT EXISTS {module_name}s (
  id INT AUTO_INCREMENT PRIMARY KEY,
  {module}_code VARCHAR(50) NOT NULL UNIQUE,
  {module}_name VARCHAR(255) NOT NULL,
  -- Module-specific fields
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_{module}_code ({module}_code),
  INDEX idx_is_active (is_active)
  -- Add module-specific indexes
);
```

#### Design Considerations
- Always include `id`, `code`, `name`, `is_active`, timestamps
- Use appropriate data types and constraints
- Create indexes for searchable and filterable fields
- Consider relationships with other modules

### Step 2: Repository Implementation

#### Repository Template (`src/lib/{module}Repository.ts`)
```typescript
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { db } from './database';

export interface {Module} {
  id: number;
  {module}Code: string;
  {module}Name: string;
  // Module-specific fields
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface {Module}Filters {
  search?: string;
  active?: boolean;
  // Module-specific filters
}

export class {Module}Repository {
  async create{Module}(data: Omit<{Module}, 'id' | 'createdAt' | 'updatedAt'>): Promise<{Module}> {
    // Implementation
  }

  async get{Module}s(filters?: {Module}Filters): Promise<{Module}[]> {
    // Implementation with filtering and search
  }

  async get{Module}ById(id: number): Promise<{Module} | null> {
    // Implementation
  }

  async update{Module}(id: number, updates: Partial<{Module}>): Promise<{Module}> {
    // Implementation
  }

  async delete{Module}(id: number): Promise<boolean> {
    // Soft delete implementation
  }
}
```

#### Key Implementation Points
- Use parameterized queries to prevent SQL injection
- Implement proper error handling with database connection fallback
- Support filtering and search functionality
- Use soft deletes (set `is_active = false`)
- Validate uniqueness constraints

### Step 3: Mock Services Implementation

#### Basic Mock Service (`src/lib/mock{Module}Service.ts`)
```typescript
import { {Module}, {Module}Filters } from './{module}Repository';

const mock{Module}s: {Module}[] = [
  // Sample data
];

export class Mock{Module}Service {
  async get{Module}s(filters?: {Module}Filters): Promise<{Module}[]> {
    // Filter and search implementation
  }

  async get{Module}ById(id: number): Promise<{Module} | null> {
    // Implementation
  }

  async create{Module}(data: Omit<{Module}, 'id' | 'createdAt' | 'updatedAt'>): Promise<{Module}> {
    // Implementation
  }

  async update{Module}(id: number, updates: Partial<{Module}>): Promise<{Module}> {
    // Implementation
  }

  async delete{Module}(id: number): Promise<boolean> {
    // Implementation
  }
}
```

#### Persistent Mock Service (`src/lib/persistentMock{Module}Service.ts`)
```typescript
import fs from 'fs/promises';
import path from 'path';
import { {Module}, {Module}Filters } from './{module}Repository';

export class PersistentMock{Module}Service {
  private dataFile = path.join(process.cwd(), 'tmp', '{module}s.json');
  
  // Implementation with file system persistence
}
```

### Step 4: API Endpoints Implementation

#### Collection Endpoint (`src/app/api/{module}s/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { {Module}Repository } from '@/lib/{module}Repository';
import { Mock{Module}Service } from '@/lib/mock{Module}Service';

const {module}Schema = z.object({
  {module}Code: z.string().min(1).max(50),
  {module}Name: z.string().min(1).max(255),
  // Module-specific validation
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      active: searchParams.get('active') === 'true',
      // Extract module-specific filters
    };

    // Try database first, fallback to mock
    let {module}s;
    try {
      const repository = new {Module}Repository();
      {module}s = await repository.get{Module}s(filters);
    } catch (error) {
      console.warn('Database unavailable, using mock data:', error);
      const mockService = new Mock{Module}Service();
      {module}s = await mockService.get{Module}s(filters);
    }

    return NextResponse.json({
      success: true,
      data: {module}s,
      count: {module}s.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch {module}s' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Implementation
}
```

#### Individual Resource Endpoint (`src/app/api/{module}s/[id]/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { {Module}Repository } from '@/lib/{module}Repository';
import { Mock{Module}Service } from '@/lib/mock{Module}Service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Implementation
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Implementation
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Implementation
}
```

### Step 5: React Hook Implementation

#### API Hook (`src/hooks/use{Module}Api.ts`)
```typescript
import { useState, useEffect, useCallback } from 'react';
import { {Module}, {Module}Filters } from '@/lib/{module}Repository';

export function use{Module}Api() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [{module}s, set{Module}s] = useState<{Module}[]>([]);

  const search{Module}s = useCallback(async (filters?: {Module}Filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.active !== undefined) params.append('active', filters.active.toString());
      // Add module-specific filters

      const response = await fetch(`/api/{module}s?${params}`);
      const data = await response.json();

      if (data.success) {
        set{Module}s(data.data);
      } else {
        setError(data.error || 'Failed to fetch {module}s');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const create{Module} = useCallback(async ({module}Data: Omit<{Module}, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Implementation
  }, []);

  const update{Module} = useCallback(async (id: number, updates: Partial<{Module}>) => {
    // Implementation
  }, []);

  const delete{Module} = useCallback(async (id: number) => {
    // Implementation
  }, []);

  const refresh{Module}s = useCallback(() => {
    search{Module}s();
  }, [search{Module}s]);

  useEffect(() => {
    search{Module}s();
  }, [search{Module}s]);

  return {
    {module}s,
    loading,
    error,
    search{Module}s,
    create{Module},
    update{Module},
    delete{Module},
    refresh{Module}s
  };
}
```

### Step 6: Frontend Integration

#### Update Page Component (`src/app/masters/{module}/page.tsx`)
```typescript
'use client';

import { useState, useMemo } from 'react';
import { use{Module}Api } from '@/hooks/use{Module}Api';
import { {Module} } from '@/lib/{module}Repository';

export default function {Module}Page() {
  const {
    {module}s,
    loading,
    error,
    search{Module}s,
    create{Module},
    update{Module},
    delete{Module}
  } = use{Module}Api();

  // Component implementation with:
  // - Search functionality
  // - CRUD operations
  // - Loading states
  // - Error handling
  // - Form validation
}
```

### Step 7: Development Tools

#### Seeding Script (`scripts/seed-{module}s.js`)
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const sample{Module}s = [
  // Sample data for seeding
];

async function seed{Module}s() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || '3306')
    });

    // Seeding implementation
    
  } catch (error) {
    console.error('Error seeding {module}s:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed{Module}s();
```

#### Update Test Script (`scripts/test-api.js`)
```javascript
// Add {module} testing functions to existing test script

async function test{Module}Endpoints() {
  console.log('\n=== Testing {Module} Endpoints ===');
  
  // Test all CRUD operations
  // Test search functionality
  // Test error scenarios
}

// Add to main test function
```

### Step 8: Configuration Updates

#### Package.json Scripts
```json
{
  "scripts": {
    "seed:{module}s": "node scripts/seed-{module}s.js"
  }
}
```

## Implementation Checklist

### Database Layer
- [ ] Create database schema with proper indexes
- [ ] Implement repository class with all CRUD operations
- [ ] Add proper error handling and validation
- [ ] Test database operations

### Mock Services
- [ ] Create basic mock service for fallback
- [ ] Implement persistent mock service for development
- [ ] Ensure feature parity with database operations
- [ ] Test fallback mechanisms

### API Layer
- [ ] Implement collection endpoint (GET/POST)
- [ ] Implement individual resource endpoint (GET/PUT/DELETE)
- [ ] Add Zod validation schemas
- [ ] Test all endpoints and error scenarios

### Frontend Layer
- [ ] Create React hook for API integration
- [ ] Update page component with database connectivity
- [ ] Implement loading states and error handling
- [ ] Add search and filtering functionality

### Development Tools
- [ ] Create seeding script with sample data
- [ ] Update API testing script
- [ ] Add npm scripts for development tasks
- [ ] Test all development workflows

### Documentation
- [ ] Update implementation documentation
- [ ] Add code examples and usage guide
- [ ] Document configuration requirements
- [ ] Create troubleshooting guide

## Best Practices

### Code Organization
- Keep each layer separate and focused
- Use consistent naming conventions
- Implement proper TypeScript types
- Follow established patterns from existing modules

### Error Handling
- Implement graceful degradation to mock data
- Provide meaningful error messages
- Log errors for debugging
- Handle network and database failures

### Performance
- Use database indexes for search fields
- Implement connection pooling
- Add debouncing for search functionality
- Consider caching for frequently accessed data

### Security
- Use parameterized queries
- Validate all input data
- Sanitize user inputs
- Implement proper access controls

### Testing
- Test all CRUD operations
- Verify fallback mechanisms
- Test error scenarios
- Validate search functionality

## Common Pitfalls to Avoid

1. **Inconsistent Data Types**: Ensure database schema matches TypeScript interfaces
2. **Missing Validation**: Always validate input data at API layer
3. **Poor Error Handling**: Don't expose sensitive error information
4. **Blocking Operations**: Use async/await properly for database operations
5. **Memory Leaks**: Properly close database connections
6. **Inconsistent State**: Ensure UI updates after successful operations

## Conclusion

Following this implementation guide ensures consistent, maintainable, and scalable master module implementations. The pattern provides robust functionality with intelligent fallback mechanisms, comprehensive error handling, and excellent developer experience.

Each new master module implementation should follow this guide to maintain consistency across the application and leverage the established infrastructure for maximum efficiency and reliability.
