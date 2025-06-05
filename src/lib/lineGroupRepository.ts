// src/lib/lineGroupRepository.ts

import { PoolConnection, RowDataPacket, OkPacket } from 'mysql2/promise';
import { getConnection } from './database';

export interface LineGroup {
  id?: number;
  groupName: string;
  description?: string;
  lineIds: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateLineGroupData {
  groupName: string;
  description?: string;
  lineIds: string[];
  isActive?: boolean;
}

export interface UpdateLineGroupData extends Partial<CreateLineGroupData> {}

export interface LineGroupFilters {
  groupName?: string;
  isActive?: boolean;
  active?: boolean; // For backward compatibility
  search?: string;
  hasLines?: boolean; // Added from the API hookº
}

export interface LineGroupStats {
  totalGroups: number;
  activeGroups: number;
  totalLinesAssigned: number;
  averageLinesPerGroup: number;
}

export class LineGroupRepository {
  private async createTableIfNotExists(connection: PoolConnection): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS line_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        groupName VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NULL,
        lineIds JSON NOT NULL DEFAULT '[]',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_line_group_name (groupName),
        INDEX idx_line_group_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
  }
  async createLineGroup(data: CreateLineGroupData): Promise<LineGroup> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      // Validate that lineIds is an array
      if (!Array.isArray(data.lineIds)) {
        throw new Error('lineIds must be an array');
      }

      // Check if group name already exists
      const [existingRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM line_groups WHERE groupName = ?',
        [data.groupName]
      );

      if (existingRows.length > 0) {
        throw new Error('A line group with this name already exists');
      }

      const insertQuery = `
        INSERT INTO line_groups (groupName, description, lineIds, isActive)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await connection.execute<OkPacket>(insertQuery, [
        data.groupName,
        data.description || null,
        JSON.stringify(data.lineIds),
        data.isActive !== undefined ? data.isActive : true
      ]);

      return await this.getLineGroupById(result.insertId);
    } finally {
      connection.release();
    }
  }
  async getLineGroupById(id: number): Promise<LineGroup> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM line_groups WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        throw new Error('Line group not found');
      }

      return this.mapRowToLineGroup(rows[0]);
    } finally {
      connection.release();
    }
  }
  async updateLineGroup(id: number, data: UpdateLineGroupData): Promise<LineGroup> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      // Check if group exists
      await this.getLineGroupById(id);

      // Check if new name conflicts with existing groups (excluding current)
      if (data.groupName) {
        const [existingRows] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM line_groups WHERE groupName = ? AND id != ?',
          [data.groupName, id]
        );

        if (existingRows.length > 0) {
          throw new Error('A line group with this name already exists');
        }
      }

      // Validate lineIds if provided
      if (data.lineIds !== undefined && !Array.isArray(data.lineIds)) {
        throw new Error('lineIds must be an array');
      }

      const updateQuery = `
        UPDATE line_groups SET 
          groupName = COALESCE(?, groupName),
          description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END,
          lineIds = COALESCE(?, lineIds),
          isActive = COALESCE(?, isActive),
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await connection.execute(updateQuery, [
        data.groupName || null,
        data.description !== undefined ? 1 : null,
        data.description !== undefined ? data.description : null,
        data.lineIds ? JSON.stringify(data.lineIds) : null,
        data.isActive !== undefined ? data.isActive : null,
        id
      ]);

      return await this.getLineGroupById(id);
    } finally {
      connection.release();
    }
  }
  async deleteLineGroup(id: number): Promise<void> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      const [result] = await connection.execute<OkPacket>(
        'DELETE FROM line_groups WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Line group not found');
      }
    } finally {
      connection.release();
    }
  }  async getLineGroups(filters: LineGroupFilters = {}): Promise<LineGroup[]> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      let query = 'SELECT * FROM line_groups WHERE 1=1';
      const params: any[] = [];

      if (filters.groupName) {
        query += ' AND groupName = ?';
        params.push(filters.groupName);
      }

      // Handle both isActive and active for backward compatibility
      if (filters.isActive !== undefined) {
        query += ' AND isActive = ?';
        params.push(filters.isActive);
      } else if (filters.active !== undefined) {
        query += ' AND isActive = ?';
        params.push(filters.active);
      }

      if (filters.search) {
        query += ' AND (groupName LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern);
      }

      query += ' ORDER BY groupName';

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);
      return rows.map(row => this.mapRowToLineGroup(row));
    } finally {
      connection.release();
    }
  }
  async getLineGroupStats(): Promise<LineGroupStats> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      const [statsRows] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as totalGroups,
          SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeGroups,
          SUM(JSON_LENGTH(lineIds)) as totalLinesAssigned,
          ROUND(AVG(JSON_LENGTH(lineIds)), 1) as averageLinesPerGroup
        FROM line_groups
      `);

      const stats = statsRows[0];
      return {
        totalGroups: stats.totalGroups || 0,
        activeGroups: stats.activeGroups || 0,
        totalLinesAssigned: stats.totalLinesAssigned || 0,
        averageLinesPerGroup: stats.averageLinesPerGroup || 0
      };
    } finally {
      connection.release();
    }
  }
  async getLineGroupByLineId(lineId: string): Promise<LineGroup | null> {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    try {
      await this.createTableIfNotExists(connection);

      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM line_groups 
         WHERE JSON_CONTAINS(lineIds, ?) AND isActive = 1`,
        [JSON.stringify(lineId)]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToLineGroup(rows[0]);
    } finally {
      connection.release();
    }
  }

  private mapRowToLineGroup(row: RowDataPacket): LineGroup {
    return {
      id: row.id,
      groupName: row.groupName,
      description: row.description || undefined,
      lineIds: JSON.parse(row.lineIds || '[]'),
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined
    };
  }
}

// Export singleton instance
export const lineGroupRepository = new LineGroupRepository();