// src/lib/lineCapacityRepository.ts
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getConnection } from './database';

export interface LineCapacity {
  id: number;
  lineId: string;
  orderNo?: string;
  buyer?: string;
  styleNo?: string;
  garmentDescription?: string;
  sam: number;
  operators: number;
  workingHours: number;
  efficiency: number;
  dailyCapacity: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineCapacityFilters {
  search?: string;
  lineId?: string;
  buyer?: string;
  active?: boolean;
  effectiveDate?: Date;
}

export interface CreateLineCapacityData {
  lineId: string;
  orderNo?: string;
  buyer?: string;
  styleNo?: string;
  garmentDescription?: string;
  sam: number;
  operators: number;
  workingHours: number;
  efficiency: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface UpdateLineCapacityData {
  lineId?: string;
  orderNo?: string;
  buyer?: string;
  styleNo?: string;
  garmentDescription?: string;
  sam?: number;
  operators?: number;
  workingHours?: number;
  efficiency?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}

export class LineCapacityRepository {  /**
   * Initialize database table for line capacity
   */
  async createTable(): Promise<void> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS line_capacities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        line_id VARCHAR(50) NOT NULL,
        order_no VARCHAR(100),
        buyer VARCHAR(100),
        style_no VARCHAR(100),
        garment_description TEXT,
        sam DECIMAL(8,2) NOT NULL,
        operators INT NOT NULL,
        working_hours DECIMAL(4,2) NOT NULL,
        efficiency DECIMAL(5,2) NOT NULL,
        daily_capacity INT GENERATED ALWAYS AS (
          FLOOR((working_hours * 60 * operators * efficiency / 100) / sam)
        ) STORED,
        effective_from DATE NOT NULL,
        effective_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_line_id (line_id),
        INDEX idx_buyer (buyer),
        INDEX idx_effective_dates (effective_from, effective_to),
        INDEX idx_active (is_active),
        INDEX idx_order_style (order_no, style_no),
        
        UNIQUE KEY unique_line_order_style_effective (line_id, order_no, style_no, effective_from),
        
        CONSTRAINT chk_sam_positive CHECK (sam > 0),
        CONSTRAINT chk_operators_positive CHECK (operators > 0),
        CONSTRAINT chk_working_hours_positive CHECK (working_hours > 0),
        CONSTRAINT chk_efficiency_range CHECK (efficiency > 0 AND efficiency <= 200),
        CONSTRAINT chk_effective_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    `;
    
    await connection.execute(createTableQuery);
    } finally {
      connection.release();
    }
  }
  /**
   * Create a new line capacity record
   */
  async createLineCapacity(data: CreateLineCapacityData): Promise<LineCapacity> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      // Validate data
      if (data.sam <= 0) {
        throw new Error('SAM must be positive');
      }
      if (data.operators <= 0) {
        throw new Error('Operators must be positive');
      }
      if (data.workingHours <= 0) {
        throw new Error('Working hours must be positive');
      }
      if (data.efficiency < 1 || data.efficiency > 200) {
        throw new Error('Efficiency must be between 1% and 200%');
      }

      const effectiveFrom = data.effectiveFrom || new Date();

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO line_capacities 
         (line_id, order_no, buyer, style_no, garment_description, sam, operators, working_hours, efficiency, effective_from, effective_to)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.lineId,
          data.orderNo || null,
          data.buyer || null,
          data.styleNo || null,
          data.garmentDescription || null,
          data.sam,
          data.operators,
          data.workingHours,
          data.efficiency,
          effectiveFrom,
          data.effectiveTo || null
        ]
      );

      // Fetch the created line capacity
      const created = await this.getLineCapacityById(result.insertId);
      if (!created) {
        throw new Error('Failed to retrieve created line capacity');
      }

      return created;
    } finally {
      connection.release();
    }
  }
  /**
   * Get all line capacities with optional filtering
   */
  async getLineCapacities(filters?: LineCapacityFilters): Promise<LineCapacity[]> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      let query = `
        SELECT id, line_id, order_no, buyer, style_no, garment_description, 
               sam, operators, working_hours, efficiency, daily_capacity,
               effective_from, effective_to, is_active, created_at, updated_at
        FROM line_capacities
        WHERE 1=1
      `;
      const params: any[] = [];

    // Apply filters
    if (filters?.active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.active);
    }

    if (filters?.lineId) {
      query += ' AND line_id = ?';
      params.push(filters.lineId);
    }

    if (filters?.buyer) {
      query += ' AND buyer LIKE ?';
      params.push(`%${filters.buyer}%`);
    }

    if (filters?.search) {
      query += ` AND (
        line_id LIKE ? OR 
        order_no LIKE ? OR 
        buyer LIKE ? OR 
        style_no LIKE ? OR 
        garment_description LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.effectiveDate) {
      query += ` AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`;
      params.push(filters.effectiveDate, filters.effectiveDate);
    }    query += ' ORDER BY created_at DESC';

    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows.map((row: any) => this.mapRowToLineCapacity(row));
    } finally {
      connection.release();
    }
  }
  /**
   * Get a line capacity by ID
   */
  async getLineCapacityById(id: number): Promise<LineCapacity | null> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, line_id, order_no, buyer, style_no, garment_description, 
                sam, operators, working_hours, efficiency, daily_capacity,
                effective_from, effective_to, is_active, created_at, updated_at
         FROM line_capacities WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToLineCapacity(rows[0]);
    } finally {
      connection.release();
    }
  }
  /**
   * Get current effective line capacity for a line
   */
  async getCurrentLineCapacity(lineId: string, effectiveDate?: Date): Promise<LineCapacity | null> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const checkDate = effectiveDate || new Date();
      
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, line_id, order_no, buyer, style_no, garment_description, 
                sam, operators, working_hours, efficiency, daily_capacity,
                effective_from, effective_to, is_active, created_at, updated_at
         FROM line_capacities 
         WHERE line_id = ? 
           AND is_active = TRUE
           AND effective_from <= ?
           AND (effective_to IS NULL OR effective_to >= ?)
         ORDER BY effective_from DESC
         LIMIT 1`,
        [lineId, checkDate, checkDate]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToLineCapacity(rows[0]);
    } finally {
      connection.release();
    }
  }
  /**
   * Update a line capacity
   */
  async updateLineCapacity(id: number, data: UpdateLineCapacityData): Promise<LineCapacity> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      // Check if line capacity exists
      const existing = await this.getLineCapacityById(id);
      if (!existing) {
        throw new Error('Line capacity not found');
      }

    // Validate data
    if (data.sam !== undefined && data.sam <= 0) {
      throw new Error('SAM must be positive');
    }
    if (data.operators !== undefined && data.operators <= 0) {
      throw new Error('Operators must be positive');
    }
    if (data.workingHours !== undefined && data.workingHours <= 0) {
      throw new Error('Working hours must be positive');
    }
    if (data.efficiency !== undefined && (data.efficiency < 1 || data.efficiency > 200)) {
      throw new Error('Efficiency must be between 1% and 200%');
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.lineId !== undefined) {
      updateFields.push('line_id = ?');
      params.push(data.lineId);
    }

    if (data.orderNo !== undefined) {
      updateFields.push('order_no = ?');
      params.push(data.orderNo || null);
    }

    if (data.buyer !== undefined) {
      updateFields.push('buyer = ?');
      params.push(data.buyer || null);
    }

    if (data.styleNo !== undefined) {
      updateFields.push('style_no = ?');
      params.push(data.styleNo || null);
    }

    if (data.garmentDescription !== undefined) {
      updateFields.push('garment_description = ?');
      params.push(data.garmentDescription || null);
    }

    if (data.sam !== undefined) {
      updateFields.push('sam = ?');
      params.push(data.sam);
    }

    if (data.operators !== undefined) {
      updateFields.push('operators = ?');
      params.push(data.operators);
    }

    if (data.workingHours !== undefined) {
      updateFields.push('working_hours = ?');
      params.push(data.workingHours);
    }

    if (data.efficiency !== undefined) {
      updateFields.push('efficiency = ?');
      params.push(data.efficiency);
    }

    if (data.effectiveFrom !== undefined) {
      updateFields.push('effective_from = ?');
      params.push(data.effectiveFrom);
    }

    if (data.effectiveTo !== undefined) {
      updateFields.push('effective_to = ?');
      params.push(data.effectiveTo);
    }

    if (data.isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(data.isActive);
    }

    if (updateFields.length === 0) {
      return existing; // No changes
    }

    params.push(id);

    await connection.execute(
      `UPDATE line_capacities SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );    // Return updated line capacity
    const updated = await this.getLineCapacityById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated line capacity');
    }

    return updated;
    } finally {
      connection.release();
    }
  }
  /**
   * Delete a line capacity (soft delete)
   */
  async deleteLineCapacity(id: number): Promise<boolean> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      const existing = await this.getLineCapacityById(id);
      if (!existing) {
        return false;
      }

      await connection.execute(
        'UPDATE line_capacities SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      return true;
    } finally {
      connection.release();
    }
  }
  /**
   * Get line capacity statistics
   */
  async getLineCapacityStats(): Promise<{
    totalRecords: number;
    activeRecords: number;
    avgDailyCapacity: number;
    avgEfficiency: number;
    totalLines: number;
  }> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as total_records,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_records,
          AVG(daily_capacity) as avg_daily_capacity,
          AVG(efficiency) as avg_efficiency,
          COUNT(DISTINCT line_id) as total_lines
        FROM line_capacities
      `);

      const stats = rows[0] as any;
      return {
        totalRecords: stats.total_records || 0,
        activeRecords: stats.active_records || 0,
        avgDailyCapacity: parseFloat((stats.avg_daily_capacity || 0).toFixed(2)),
        avgEfficiency: parseFloat((stats.avg_efficiency || 0).toFixed(2)),
        totalLines: stats.total_lines || 0
      };
    } finally {
      connection.release();
    }
  }
  /**
   * Get capacity summary by line
   */
  async getCapacitySummaryByLine(): Promise<Array<{
    lineId: string;
    recordCount: number;
    avgDailyCapacity: number;
    maxDailyCapacity: number;
    avgEfficiency: number;
    latestUpdate: Date;
  }>> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          line_id,
          COUNT(*) as record_count,
          AVG(daily_capacity) as avg_daily_capacity,
          MAX(daily_capacity) as max_daily_capacity,
          AVG(efficiency) as avg_efficiency,
          MAX(updated_at) as latest_update
        FROM line_capacities
        WHERE is_active = TRUE
        GROUP BY line_id
        ORDER BY line_id
      `);

      return rows.map((row: any) => ({
        lineId: row.line_id,
        recordCount: row.record_count || 0,
        avgDailyCapacity: parseFloat((row.avg_daily_capacity || 0).toFixed(2)),
        maxDailyCapacity: parseFloat((row.max_daily_capacity || 0).toFixed(2)),
        avgEfficiency: parseFloat((row.avg_efficiency || 0).toFixed(2)),
        latestUpdate: row.latest_update
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Map database row to LineCapacity interface
   */
  private mapRowToLineCapacity(row: any): LineCapacity {
    return {
      id: row.id,
      lineId: row.line_id,
      orderNo: row.order_no || undefined,
      buyer: row.buyer || undefined,
      styleNo: row.style_no || undefined,
      garmentDescription: row.garment_description || undefined,
      sam: parseFloat(row.sam),
      operators: row.operators,
      workingHours: parseFloat(row.working_hours),
      efficiency: parseFloat(row.efficiency),
      dailyCapacity: parseFloat(row.daily_capacity),
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to || undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Export singleton instance
export const lineCapacityRepository = new LineCapacityRepository();
