// src/lib/lineCapacityRepository.ts

import { PoolConnection, RowDataPacket, OkPacket } from 'mysql2/promise';
import { getConnection } from './database';

export interface LineCapacity {
  id?: number;
  lineId: string;
  orderNo?: string;
  buyer?: string;
  styleNo?: string;
  garmentDescription?: string;
  sam: number;
  operators: number;
  workingHours: number;
  efficiency: number;
  dailyCapacity?: number; // Calculated field
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdAt?: Date;
  updatedAt?: Date;
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

export interface UpdateLineCapacityData extends Partial<CreateLineCapacityData> {}

export interface LineCapacityFilters {
  lineId?: string;
  orderNo?: string;
  buyer?: string;
  styleNo?: string;
  effectiveDate?: Date;
  minCapacity?: number;
  maxCapacity?: number;
  search?: string;
  isActive?: boolean;
  active?: boolean; // For backward compatibility
}

export interface LineCapacityStats {
  totalRules: number;
  activeRules: number;
  uniqueLines: number;
  averageCapacity: number;
  totalCapacity: number;
}

export class LineCapacityRepository {
  private async createTableIfNotExists(connection: PoolConnection): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS line_capacities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lineId VARCHAR(50) NOT NULL,
        orderNo VARCHAR(100) NULL,
        buyer VARCHAR(100) NULL,
        styleNo VARCHAR(100) NULL,
        garmentDescription TEXT NULL,
        sam DECIMAL(8,3) NOT NULL,
        operators INT NOT NULL,
        workingHours DECIMAL(4,1) NOT NULL DEFAULT 8.0,
        efficiency DECIMAL(5,2) NOT NULL DEFAULT 85.00,
        dailyCapacity INT GENERATED ALWAYS AS (
          ROUND((operators * workingHours * 60 * (efficiency / 100)) / sam)
        ) STORED,
        effectiveFrom DATE NULL,
        effectiveTo DATE NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_line_capacity_line (lineId),
        INDEX idx_line_capacity_order (orderNo),
        INDEX idx_line_capacity_buyer (buyer),
        INDEX idx_line_capacity_style (styleNo),
        INDEX idx_line_capacity_effective (effectiveFrom, effectiveTo),
        INDEX idx_line_capacity_daily (dailyCapacity),
        UNIQUE KEY uk_line_capacity_unique (lineId, orderNo, buyer, styleNo, effectiveFrom)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
  }
  async createLineCapacity(data: CreateLineCapacityData): Promise<LineCapacity> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      // Validate date range
      if (data.effectiveFrom && data.effectiveTo && data.effectiveFrom >= data.effectiveTo) {
        throw new Error('Effective date must be before expiry date');
      }

      // Check for overlapping periods for the same line/order/buyer/style combination
      const overlapQuery = `
        SELECT id FROM line_capacities 
        WHERE lineId = ? 
        AND COALESCE(orderNo, '') = COALESCE(?, '') 
        AND COALESCE(buyer, '') = COALESCE(?, '') 
        AND COALESCE(styleNo, '') = COALESCE(?, '')
        AND (
          (effectiveFrom IS NULL OR effectiveFrom <= COALESCE(?, '9999-12-31'))
          AND (effectiveTo IS NULL OR effectiveTo >= COALESCE(?, '1900-01-01'))
        )
      `;

      const [existingRows] = await connection.execute<RowDataPacket[]>(
        overlapQuery,
        [
          data.lineId,
          data.orderNo || null,
          data.buyer || null,
          data.styleNo || null,
          data.effectiveTo || null,
          data.effectiveFrom || null
        ]
      );

      if (existingRows.length > 0) {
        throw new Error('A capacity rule already exists for this combination with overlapping effective period');
      }

      const insertQuery = `
        INSERT INTO line_capacities (
          lineId, orderNo, buyer, styleNo, garmentDescription, sam, 
          operators, workingHours, efficiency, effectiveFrom, effectiveTo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute<OkPacket>(insertQuery, [
        data.lineId,
        data.orderNo || null,
        data.buyer || null,
        data.styleNo || null,
        data.garmentDescription || null,
        data.sam,
        data.operators,
        data.workingHours,
        data.efficiency,
        data.effectiveFrom || null,
        data.effectiveTo || null
      ]);

      return await this.getLineCapacityById(result.insertId);
    } finally {
      connection.release();
    }
  }
  async getLineCapacityById(id: number): Promise<LineCapacity> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM line_capacities WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        throw new Error('Line capacity not found');
      }

      return this.mapRowToLineCapacity(rows[0]);
    } finally {
      connection.release();
    }
  }
  async updateLineCapacity(id: number, data: UpdateLineCapacityData): Promise<LineCapacity> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      // Get existing record
      const existing = await this.getLineCapacityById(id);

      // Validate date range
      const newEffectiveFrom = data.effectiveFrom ?? existing.effectiveFrom;
      const newEffectiveTo = data.effectiveTo ?? existing.effectiveTo;
      
      if (newEffectiveFrom && newEffectiveTo && newEffectiveFrom >= newEffectiveTo) {
        throw new Error('Effective date must be before expiry date');
      }

      // Check for overlapping periods (excluding current record)
      if (data.lineId || data.orderNo !== undefined || data.buyer !== undefined || 
          data.styleNo !== undefined || data.effectiveFrom || data.effectiveTo) {
        
        const overlapQuery = `
          SELECT id FROM line_capacities 
          WHERE id != ? 
          AND lineId = ? 
          AND COALESCE(orderNo, '') = COALESCE(?, '') 
          AND COALESCE(buyer, '') = COALESCE(?, '') 
          AND COALESCE(styleNo, '') = COALESCE(?, '')
          AND (
            (effectiveFrom IS NULL OR effectiveFrom <= COALESCE(?, '9999-12-31'))
            AND (effectiveTo IS NULL OR effectiveTo >= COALESCE(?, '1900-01-01'))
          )
        `;

        const [existingRows] = await connection.execute<RowDataPacket[]>(
          overlapQuery,
          [
            id,
            data.lineId ?? existing.lineId,
            data.orderNo !== undefined ? data.orderNo : existing.orderNo,
            data.buyer !== undefined ? data.buyer : existing.buyer,
            data.styleNo !== undefined ? data.styleNo : existing.styleNo,
            newEffectiveTo || null,
            newEffectiveFrom || null
          ]
        );

        if (existingRows.length > 0) {
          throw new Error('A capacity rule already exists for this combination with overlapping effective period');
        }
      }

      const updateQuery = `
        UPDATE line_capacities SET 
          lineId = COALESCE(?, lineId),
          orderNo = CASE WHEN ? IS NOT NULL THEN ? ELSE orderNo END,
          buyer = CASE WHEN ? IS NOT NULL THEN ? ELSE buyer END,
          styleNo = CASE WHEN ? IS NOT NULL THEN ? ELSE styleNo END,
          garmentDescription = CASE WHEN ? IS NOT NULL THEN ? ELSE garmentDescription END,
          sam = COALESCE(?, sam),
          operators = COALESCE(?, operators),
          workingHours = COALESCE(?, workingHours),
          efficiency = COALESCE(?, efficiency),
          effectiveFrom = CASE WHEN ? IS NOT NULL THEN ? ELSE effectiveFrom END,
          effectiveTo = CASE WHEN ? IS NOT NULL THEN ? ELSE effectiveTo END,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await connection.execute(updateQuery, [
        data.lineId || null,
        data.orderNo !== undefined ? 1 : null, data.orderNo !== undefined ? data.orderNo : null,
        data.buyer !== undefined ? 1 : null, data.buyer !== undefined ? data.buyer : null,
        data.styleNo !== undefined ? 1 : null, data.styleNo !== undefined ? data.styleNo : null,
        data.garmentDescription !== undefined ? 1 : null, data.garmentDescription !== undefined ? data.garmentDescription : null,
        data.sam || null,
        data.operators || null,
        data.workingHours || null,
        data.efficiency || null,
        data.effectiveFrom !== undefined ? 1 : null, data.effectiveFrom !== undefined ? data.effectiveFrom : null,
        data.effectiveTo !== undefined ? 1 : null, data.effectiveTo !== undefined ? data.effectiveTo : null,
        id
      ]);

      return await this.getLineCapacityById(id);
    } finally {
      connection.release();
    }
  }
  async deleteLineCapacity(id: number): Promise<void> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      const [result] = await connection.execute<OkPacket>(
        'DELETE FROM line_capacities WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Line capacity not found');
      }
    } finally {
      connection.release();
    }
  }  async getLineCapacities(filters: LineCapacityFilters = {}): Promise<LineCapacity[]> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      let query = 'SELECT * FROM line_capacities WHERE 1=1';
      const params: any[] = [];

      if (filters.lineId) {
        query += ' AND lineId = ?';
        params.push(filters.lineId);
      }

      if (filters.orderNo) {
        query += ' AND orderNo = ?';
        params.push(filters.orderNo);
      }
      
      // Handle both isActive and active for backward compatibility
      if (filters.isActive !== undefined) {
        const currentDate = new Date();
        query += ' AND (effectiveFrom IS NULL OR effectiveFrom <= ?) AND (effectiveTo IS NULL OR effectiveTo >= ?)';
        params.push(currentDate, currentDate);
      } else if (filters.active !== undefined) {
        const currentDate = new Date();
        query += ' AND (effectiveFrom IS NULL OR effectiveFrom <= ?) AND (effectiveTo IS NULL OR effectiveTo >= ?)';
        params.push(currentDate, currentDate);
      }

      if (filters.buyer) {
        query += ' AND buyer = ?';
        params.push(filters.buyer);
      }

      if (filters.styleNo) {
        query += ' AND styleNo = ?';
        params.push(filters.styleNo);
      }

      if (filters.effectiveDate) {
        query += ' AND (effectiveFrom IS NULL OR effectiveFrom <= ?) AND (effectiveTo IS NULL OR effectiveTo >= ?)';
        params.push(filters.effectiveDate, filters.effectiveDate);
      }

      if (filters.minCapacity) {
        query += ' AND dailyCapacity >= ?';
        params.push(filters.minCapacity);
      }

      if (filters.maxCapacity) {
        query += ' AND dailyCapacity <= ?';
        params.push(filters.maxCapacity);
      }

      if (filters.search) {
        query += ` AND (
          lineId LIKE ? OR 
          orderNo LIKE ? OR 
          buyer LIKE ? OR 
          styleNo LIKE ? OR 
          garmentDescription LIKE ?
        )`;
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      query += ' ORDER BY lineId, effectiveFrom DESC, id DESC';

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);
      return rows.map(row => this.mapRowToLineCapacity(row));
    } finally {
      connection.release();
    }
  }
  async getEffectiveCapacity(
    lineId: string, 
    orderNo?: string, 
    buyer?: string, 
    styleNo?: string, 
    effectiveDate: Date = new Date()
  ): Promise<LineCapacity | null> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      // Priority: specific order/buyer/style > line-specific > general
      const queries = [
        // Exact match with all parameters
        {
          query: `
            SELECT * FROM line_capacities 
            WHERE lineId = ? AND orderNo = ? AND buyer = ? AND styleNo = ?
            AND (effectiveFrom IS NULL OR effectiveFrom <= ?)
            AND (effectiveTo IS NULL OR effectiveTo >= ?)
            ORDER BY effectiveFrom DESC LIMIT 1
          `,
          params: [lineId, orderNo, buyer, styleNo, effectiveDate, effectiveDate]
        },
        // Match with order and buyer
        {
          query: `
            SELECT * FROM line_capacities 
            WHERE lineId = ? AND orderNo = ? AND buyer = ? AND styleNo IS NULL
            AND (effectiveFrom IS NULL OR effectiveFrom <= ?)
            AND (effectiveTo IS NULL OR effectiveTo >= ?)
            ORDER BY effectiveFrom DESC LIMIT 1
          `,
          params: [lineId, orderNo, buyer, effectiveDate, effectiveDate]
        },
        // Match with order only
        {
          query: `
            SELECT * FROM line_capacities 
            WHERE lineId = ? AND orderNo = ? AND buyer IS NULL AND styleNo IS NULL
            AND (effectiveFrom IS NULL OR effectiveFrom <= ?)
            AND (effectiveTo IS NULL OR effectiveTo >= ?)
            ORDER BY effectiveFrom DESC LIMIT 1
          `,
          params: [lineId, orderNo, effectiveDate, effectiveDate]
        },
        // Line-specific default
        {
          query: `
            SELECT * FROM line_capacities 
            WHERE lineId = ? AND orderNo IS NULL AND buyer IS NULL AND styleNo IS NULL
            AND (effectiveFrom IS NULL OR effectiveFrom <= ?)
            AND (effectiveTo IS NULL OR effectiveTo >= ?)
            ORDER BY effectiveFrom DESC LIMIT 1
          `,
          params: [lineId, effectiveDate, effectiveDate]
        }
      ];

      for (const { query, params } of queries) {
        const [rows] = await connection.execute<RowDataPacket[]>(query, params);
        if (rows.length > 0) {
          return this.mapRowToLineCapacity(rows[0]);
        }
      }

      return null;
    } finally {
      connection.release();
    }
  }
  async getLineCapacityStats(): Promise<LineCapacityStats> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      const [statsRows] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as totalRules,
          COUNT(CASE WHEN 
            (effectiveFrom IS NULL OR effectiveFrom <= CURDATE()) AND 
            (effectiveTo IS NULL OR effectiveTo >= CURDATE()) 
            THEN 1 END) as activeRules,
          COUNT(DISTINCT lineId) as uniqueLines,
          ROUND(AVG(COALESCE(dailyCapacity, 0)), 0) as averageCapacity,
          SUM(COALESCE(dailyCapacity, 0)) as totalCapacity
        FROM line_capacities
      `);

      const stats = statsRows[0];
      return {
        totalRules: stats.totalRules || 0,
        activeRules: stats.activeRules || 0,
        uniqueLines: stats.uniqueLines || 0,
        averageCapacity: stats.averageCapacity || 0,
        totalCapacity: stats.totalCapacity || 0
      };
    } finally {
      connection.release();
    }
  }

  private mapRowToLineCapacity(row: RowDataPacket): LineCapacity {
    return {
      id: row.id,
      lineId: row.lineId,
      orderNo: row.orderNo || undefined,
      buyer: row.buyer || undefined,
      styleNo: row.styleNo || undefined,
      garmentDescription: row.garmentDescription || undefined,
      sam: parseFloat(row.sam),
      operators: row.operators,
      workingHours: parseFloat(row.workingHours),
      efficiency: parseFloat(row.efficiency),
      dailyCapacity: row.dailyCapacity || undefined,
      effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom) : undefined,
      effectiveTo: row.effectiveTo ? new Date(row.effectiveTo) : undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined
    };
  }
}

// Export singleton instance
export const lineCapacityRepository = new LineCapacityRepository();