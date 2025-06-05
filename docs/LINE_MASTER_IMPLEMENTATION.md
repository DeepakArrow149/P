# Line Master Database Implementation Documentation

## Overview

This document describes the complete implementation of MySQL database connectivity for the Line master module in the Next.js React application. The implementation follows the same robust pattern established for the buyer master module, providing a complete CRUD system with proper error handling, loading states, and intelligent fallback mechanisms.

## Implementation Architecture

### Database Layer
- **LineRepository** (`src/lib/lineRepository.ts`): Complete CRUD operations for MySQL
- **Mock Services**: Fallback mechanisms when database is unavailable
  - `mockLineService.ts`: Basic mock data service
  - `persistentMockLineService.ts`: Enhanced mock service with data persistence

### API Layer
- **REST Endpoints**: Full RESTful API for line operations
  - `GET/POST /api/lines`: List and create lines
  - `GET/PUT/DELETE /api/lines/[id]`: Individual line operations
- **Validation**: Zod schemas for data validation
- **Fallback System**: Automatic fallback to mock data when database unavailable

### Frontend Integration
- **React Hook** (`useLineApi.ts`): Custom hook for API integration
- **UI Components**: Updated line page with database connectivity
- **Features**: Loading states, error handling, search functionality, real-time updates

## Database Schema

### Lines Table Structure
```sql
CREATE TABLE IF NOT EXISTS lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  line_code VARCHAR(50) NOT NULL UNIQUE,
  line_name VARCHAR(255) NOT NULL,
  unit_id INT,
  line_type ENUM('KNIT', 'WOVEN', 'FINISHING', 'PACKING', 'CUTTING') DEFAULT 'KNIT',
  capacity_per_day DECIMAL(10,2) DEFAULT 0.00,
  efficiency_percentage DECIMAL(5,2) DEFAULT 85.00,
  working_hours DECIMAL(4,2) DEFAULT 8.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_line_code (line_code),
  INDEX idx_unit_id (unit_id),
  INDEX idx_line_type (line_type),
  INDEX idx_is_active (is_active)
);
```

## Key Features Implemented

### 1. Database Operations (LineRepository)

#### Create Line
```typescript
async createLine(lineData: Omit<Line, 'id' | 'createdAt' | 'updatedAt'>): Promise<Line>
```
- Validates unique line codes
- Creates database entry with proper validation
- Returns created line with generated ID

#### Read Operations
```typescript
async getLines(filters?: LineFilters): Promise<Line[]>
async getLineById(id: number): Promise<Line | null>
```
- Supports filtering by unit, line type, active status
- Text search across line code and name
- Proper error handling and connection management

#### Update Line
```typescript
async updateLine(id: number, updates: Partial<Line>): Promise<Line>
```
- Validates line existence
- Prevents duplicate line codes
- Returns updated line data

#### Delete Line
```typescript
async deleteLine(id: number): Promise<boolean>
```
- Soft delete implementation (sets is_active = false)
- Validates line existence before deletion

### 2. API Endpoints

#### GET /api/lines
- Lists all lines with optional filtering
- Query parameters: `unit`, `lineType`, `search`, `active`
- Returns paginated results with metadata

#### POST /api/lines
- Creates new line with validation
- Validates required fields and uniqueness
- Returns created line or validation errors

#### GET /api/lines/[id]
- Retrieves specific line by ID
- Returns 404 if line not found

#### PUT /api/lines/[id]
- Updates existing line
- Validates data and prevents conflicts
- Returns updated line data

#### DELETE /api/lines/[id]
- Soft deletes line (sets inactive)
- Returns success confirmation

### 3. Frontend Integration

#### useLineApi Hook
```typescript
const {
  lines,
  loading,
  error,
  searchLines,
  createLine,
  updateLine,
  deleteLine,
  refreshLines
} = useLineApi();
```

#### Features
- **Real-time Search**: Debounced search with 300ms delay
- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages
- **Auto-refresh**: Automatic data reload after operations

### 4. Fallback System

#### Database Availability Detection
- Automatically detects database connectivity issues
- Falls back to mock data when database unavailable
- Independent fallback for each master module

#### Mock Data Persistence
- Uses file system storage in `tmp/` directory
- Maintains data between sessions
- Seamless transition between database and mock data

## Development Tools

### Database Seeding
```bash
npm run seed:lines
```
- Seeds database with sample line data
- Creates various line types and configurations
- Useful for development and testing

### API Testing
```bash
node scripts/test-api.js
```
- Comprehensive testing of all line endpoints
- Tests CRUD operations and search functionality
- Validates error handling and edge cases

## Configuration

### Environment Variables
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=planner_db
MYSQL_PORT=3306
```

### Database Connection
- Uses connection pooling for performance
- Automatic reconnection on connection loss
- Proper connection cleanup and error handling

## Error Handling

### Database Level
- Connection error handling with fallback
- SQL constraint validation
- Proper transaction management

### API Level
- Comprehensive error responses
- HTTP status code mapping
- Validation error details

### Frontend Level
- User-friendly error messages
- Loading state management
- Graceful degradation

## Testing Strategy

### API Testing
- All CRUD operations tested
- Search functionality validation
- Error scenario testing
- Performance testing with large datasets

### Database Testing
- Connection pooling verification
- Constraint validation testing
- Fallback mechanism testing

## Performance Considerations

### Database Optimization
- Proper indexing on searchable fields
- Connection pooling for concurrent requests
- Optimized queries with minimal data transfer

### Frontend Optimization
- Debounced search to reduce API calls
- Efficient state management
- Lazy loading for large datasets

## Security Measures

### Input Validation
- Zod schema validation on API layer
- SQL injection prevention with parameterized queries
- XSS prevention with proper data sanitization

### Access Control
- Input sanitization and validation
- Proper error message handling (no sensitive data exposure)

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Import/export functionality
2. **Advanced Filtering**: More sophisticated search options
3. **Audit Trail**: Track all changes with user information
4. **Real-time Updates**: WebSocket integration for live updates
5. **Performance Metrics**: Line efficiency tracking and reporting

### Scalability Considerations
1. **Caching Layer**: Redis integration for frequently accessed data
2. **Database Sharding**: Horizontal scaling for large datasets
3. **API Rate Limiting**: Prevent abuse and ensure fair usage
4. **Monitoring**: Application performance monitoring and alerting

## Deployment Checklist

### Pre-deployment
- [ ] Database schema applied to production
- [ ] Environment variables configured
- [ ] SSL certificates for database connections
- [ ] Backup and recovery procedures tested

### Post-deployment
- [ ] API endpoints functional testing
- [ ] Database connectivity verification
- [ ] Fallback mechanism testing
- [ ] Performance monitoring setup

## Troubleshooting

### Common Issues

#### Database Connection Failures
- Check environment variables
- Verify database server status
- Validate network connectivity
- Review connection pool settings

#### API Errors
- Check request format and validation
- Verify authentication if applicable
- Review server logs for detailed errors
- Test with mock data to isolate issues

#### Frontend Issues
- Check browser console for JavaScript errors
- Verify API endpoint responses
- Test with different browsers
- Review network tab for failed requests

## Code Examples

### Creating a New Line
```typescript
const newLine = await createLine({
  lineCode: 'LINE001',
  lineName: 'Knitting Line 1',
  unitId: 1,
  lineType: 'KNIT',
  capacityPerDay: 100.00,
  efficiencyPercentage: 85.00,
  workingHours: 8.00,
  isActive: true
});
```

### Searching Lines
```typescript
const searchResults = await searchLines({
  search: 'knit',
  lineType: 'KNIT',
  unit: 1,
  active: true
});
```

### Updating a Line
```typescript
const updatedLine = await updateLine(1, {
  lineName: 'Updated Line Name',
  capacityPerDay: 120.00,
  efficiencyPercentage: 90.00
});
```

## Conclusion

The Line master database implementation provides a robust, scalable, and maintainable solution for line management in the production planning system. The implementation follows industry best practices and provides excellent user experience with comprehensive error handling and fallback mechanisms.

The modular architecture allows for easy extension and modification, while the intelligent fallback system ensures the application remains functional even when database connectivity issues occur.
