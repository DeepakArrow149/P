// src/lib/lineRepository.ts
import { RowDataPacket, OkPacket } from 'mysql2';
import { getConnection } from './database';

export interface Line {
  id: string;
  lineCode: string;
  lineName: string;
  unitId: string;
  lineType?: 'Sewing' | 'Cutting' | 'Finishing' | 'Assembly' | 'Packing' | 'Other' | null;
  defaultCapacity?: number | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateLineData {
  lineCode: string;
  lineName: string;
  unitId: string;
  lineType?: 'Sewing' | 'Cutting' | 'Finishing' | 'Assembly' | 'Packing' | 'Other';
  defaultCapacity?: number;
  notes?: string;
}

export interface UpdateLineData {
  lineCode?: string;
  lineName?: string;
  unitId?: string;
  lineType?: 'Sewing' | 'Cutting' | 'Finishing' | 'Assembly' | 'Packing' | 'Other';
  defaultCapacity?: number;
  notes?: string;
}

export interface LineSearchParams {
  search?: string;
  unitId?: string;
  lineType?: string;
  limit?: number;
  offset?: number;
}

export class LineRepository {
  private async ensureTableExists(): Promise<void> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`lines\` (
          id VARCHAR(50) PRIMARY KEY,
          lineCode VARCHAR(20) NOT NULL UNIQUE,
          lineName VARCHAR(100) NOT NULL,
          unitId VARCHAR(50) NOT NULL,
          lineType ENUM('Sewing', 'Cutting', 'Finishing', 'Assembly', 'Packing', 'Other') DEFAULT NULL,
          defaultCapacity INT DEFAULT 0,
          notes TEXT DEFAULT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_lineCode (lineCode),
          INDEX idx_lineName (lineName),
          INDEX idx_unitId (unitId),
          INDEX idx_lineType (lineType)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } finally {
      connection.release();
    }
  }

  private mapRowToLine(row: RowDataPacket): Line {
    return {      id: row.id,
      lineCode: row.lineCode,
      lineName: row.lineName,
      unitId: row.unitId,
      lineType: row.lineType || undefined,
      defaultCapacity: row.defaultCapacity || undefined,
      notes: row.notes || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }  async findMany(params: LineSearchParams = {}): Promise<Line[]> {
    await this.ensureTableExists();
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      let query = 'SELECT * FROM `lines` WHERE 1=1';
      const queryParams: any[] = [];      if (params.search) {
        query += ' AND (lineCode LIKE ? OR lineName LIKE ?)';
        const searchPattern = `%${params.search}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      if (params.unitId) {
        query += ' AND unitId = ?';
        queryParams.push(params.unitId);
      }

      if (params.lineType) {
        query += ' AND lineType = ?';
        queryParams.push(params.lineType);
      }

      query += ' ORDER BY lineCode ASC';

      if (params.limit) {
        query += ' LIMIT ?';
        queryParams.push(params.limit);
        
        if (params.offset) {
          query += ' OFFSET ?';
          queryParams.push(params.offset);
        }
      }

      const [rows] = await connection.execute(query, queryParams);
      return (rows as RowDataPacket[]).map(row => this.mapRowToLine(row));
    } finally {
      connection.release();
    }
  }
  async findById(id: string): Promise<Line | null> {
    await this.ensureTableExists();
    const pool = await getConnection();
    const connection = await pool.getConnection();
      try {
      const [rows] = await connection.execute(
        'SELECT * FROM `lines` WHERE id = ?',
        [id]
      );
      const results = rows as RowDataPacket[];
      return results.length > 0 ? this.mapRowToLine(results[0]) : null;
    } finally {
      connection.release();
    }
  }
  async findByCode(lineCode: string): Promise<Line | null> {
    await this.ensureTableExists();
    const pool = await getConnection();
    const connection = await pool.getConnection();
      try {      const [rows] = await connection.execute(
        'SELECT * FROM `lines` WHERE lineCode = ?',
        [lineCode]
      );
      const results = rows as RowDataPacket[];
      return results.length > 0 ? this.mapRowToLine(results[0]) : null;
    } finally {
      connection.release();
    }
  }
  async create(data: CreateLineData): Promise<Line> {
    await this.ensureTableExists();
    
    // Validate line code uniqueness
    const existingLine = await this.findByCode(data.lineCode);
    if (existingLine) {
      throw new Error(`Line with code "${data.lineCode}" already exists`);
    }

    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const id = `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;      await connection.execute(
        `INSERT INTO \`lines\` (id, lineCode, lineName, unitId, lineType, defaultCapacity, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.lineCode,
          data.lineName,
          data.unitId,
          data.lineType || null,
          data.defaultCapacity || 0,
          data.notes || null
        ]
      );

      const newLine = await this.findById(id);
      if (!newLine) {
        throw new Error('Failed to retrieve created line');
      }
      
      return newLine;
    } finally {
      connection.release();
    }
  }
  async update(id: string, data: UpdateLineData): Promise<Line> {
    await this.ensureTableExists();
    
    // Check if line exists
    const existingLine = await this.findById(id);
    if (!existingLine) {
      throw new Error(`Line with ID "${id}" not found`);
    }

    // Validate line code uniqueness if being updated
    if (data.lineCode && data.lineCode !== existingLine.lineCode) {
      const lineWithSameCode = await this.findByCode(data.lineCode);
      if (lineWithSameCode) {
        throw new Error(`Line with code "${data.lineCode}" already exists`);
      }
    }

    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];      if (data.lineCode !== undefined) {
        updateFields.push('lineCode = ?');
        updateValues.push(data.lineCode);
      }
      if (data.lineName !== undefined) {
        updateFields.push('lineName = ?');
        updateValues.push(data.lineName);
      }
      if (data.unitId !== undefined) {
        updateFields.push('unitId = ?');
        updateValues.push(data.unitId);
      }
      if (data.lineType !== undefined) {
        updateFields.push('lineType = ?');
        updateValues.push(data.lineType);
      }
      if (data.defaultCapacity !== undefined) {
        updateFields.push('defaultCapacity = ?');
        updateValues.push(data.defaultCapacity);
      }
      if (data.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(data.notes || null);
      }

      if (updateFields.length === 0) {
        return existingLine; // No changes to make
      }

      updateValues.push(id);
        await connection.execute(
        `UPDATE \`lines\` SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const updatedLine = await this.findById(id);
      if (!updatedLine) {
        throw new Error('Failed to retrieve updated line');
      }
      
      return updatedLine;
    } finally {
      connection.release();
    }
  }
  async delete(id: string): Promise<boolean> {
    await this.ensureTableExists();
    
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(        'DELETE FROM `lines` WHERE id = ?',
        [id]
      );
      
      const deleteResult = result as OkPacket;
      return deleteResult.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
  async count(params: LineSearchParams = {}): Promise<number> {
    await this.ensureTableExists();
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {      let query = 'SELECT COUNT(*) as count FROM `lines` WHERE 1=1';
      const queryParams: any[] = [];      if (params.search) {
        query += ' AND (lineCode LIKE ? OR lineName LIKE ?)';
        const searchPattern = `%${params.search}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      if (params.unitId) {
        query += ' AND unitId = ?';
        queryParams.push(params.unitId);
      }

      if (params.lineType) {
        query += ' AND lineType = ?';
        queryParams.push(params.lineType);
      }

      const [rows] = await connection.execute(query, queryParams);
      const results = rows as RowDataPacket[];
      return results[0].count;
    } finally {
      connection.release();
    }
  }
  async deleteAll(): Promise<number> {
    await this.ensureTableExists();
    const pool = await getConnection();
    const connection = await pool.getConnection();
      try {
      const [result] = await connection.execute('DELETE FROM `lines`');
      const deleteResult = result as OkPacket;
      return deleteResult.affectedRows;
    } finally {
      connection.release();
    }
  }
}

export const lineRepository = new LineRepository();
