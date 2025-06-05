// src/lib/lineGroupRepository.ts
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getConnection } from './database';

export interface LineGroup {
  id: number;
  groupName: string;
  description?: string;
  lineIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineGroupFilters {
  search?: string;
  active?: boolean;
  hasLines?: boolean;
}

export interface CreateLineGroupData {
  groupName: string;
  description?: string;
  lineIds: string[];
}

export interface UpdateLineGroupData {
  groupName?: string;
  description?: string;
  lineIds?: string[];
  isActive?: boolean;
}

export class LineGroupRepository {
  /**
   * Initialize database table for line groups
   */
  async createTable(): Promise<void> {
    const connection = await getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS line_groups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        group_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        line_ids JSON NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_group_name (group_name),
        INDEX idx_active (is_active),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.execute(createTableQuery);
  }

  /**
   * Create a new line group
   */
  async createLineGroup(data: CreateLineGroupData): Promise<LineGroup> {
    const connection = await getConnection();
    
    // Validate data
    if (!data.groupName || data.groupName.trim().length === 0) {
      throw new Error('Group name is required');
    }
    
    if (!data.lineIds || data.lineIds.length === 0) {
      throw new Error('At least one line must be assigned to the group');
    }

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO line_groups (group_name, description, line_ids)
       VALUES (?, ?, ?)`,
      [
        data.groupName.trim(),
        data.description?.trim() || null,
        JSON.stringify(data.lineIds)
      ]
    );

    // Fetch the created line group
    const created = await this.getLineGroupById(result.insertId);
    if (!created) {
      throw new Error('Failed to retrieve created line group');
    }

    return created;
  }

  /**
   * Get all line groups with optional filtering
   */
  async getLineGroups(filters?: LineGroupFilters): Promise<LineGroup[]> {
    const connection = await getConnection();
    
    let query = `
      SELECT id, group_name, description, line_ids, is_active, created_at, updated_at
      FROM line_groups
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters?.active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.active);
    }

    if (filters?.search) {
      query += ' AND (group_name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters?.hasLines !== undefined) {
      if (filters.hasLines) {
        query += ' AND JSON_LENGTH(line_ids) > 0';
      } else {
        query += ' AND JSON_LENGTH(line_ids) = 0';
      }
    }

    query += ' ORDER BY group_name ASC';

    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows.map((row: any) => this.mapRowToLineGroup(row));
  }

  /**
   * Get a line group by ID
   */
  async getLineGroupById(id: number): Promise<LineGroup | null> {
    const connection = await getConnection();
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, group_name, description, line_ids, is_active, created_at, updated_at
       FROM line_groups WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToLineGroup(rows[0]);
  }

  /**
   * Get a line group by name
   */
  async getLineGroupByName(groupName: string): Promise<LineGroup | null> {
    const connection = await getConnection();
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, group_name, description, line_ids, is_active, created_at, updated_at
       FROM line_groups WHERE group_name = ?`,
      [groupName]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToLineGroup(rows[0]);
  }

  /**
   * Update a line group
   */
  async updateLineGroup(id: number, data: UpdateLineGroupData): Promise<LineGroup> {
    const connection = await getConnection();
    
    // Check if line group exists
    const existing = await this.getLineGroupById(id);
    if (!existing) {
      throw new Error('Line group not found');
    }

    // Validate data
    if (data.groupName !== undefined && (!data.groupName || data.groupName.trim().length === 0)) {
      throw new Error('Group name cannot be empty');
    }
    
    if (data.lineIds !== undefined && data.lineIds.length === 0) {
      throw new Error('At least one line must be assigned to the group');
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.groupName !== undefined) {
      updateFields.push('group_name = ?');
      params.push(data.groupName.trim());
    }

    if (data.description !== undefined) {
      updateFields.push('description = ?');
      params.push(data.description?.trim() || null);
    }

    if (data.lineIds !== undefined) {
      updateFields.push('line_ids = ?');
      params.push(JSON.stringify(data.lineIds));
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
      `UPDATE line_groups SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Return updated line group
    const updated = await this.getLineGroupById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated line group');
    }

    return updated;
  }

  /**
   * Delete a line group (soft delete)
   */
  async deleteLineGroup(id: number): Promise<boolean> {
    const connection = await getConnection();
    
    const existing = await this.getLineGroupById(id);
    if (!existing) {
      return false;
    }

    await connection.execute(
      'UPDATE line_groups SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    return true;
  }

  /**
   * Get line groups that contain a specific line
   */
  async getLineGroupsContainingLine(lineId: string): Promise<LineGroup[]> {
    const connection = await getConnection();
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, group_name, description, line_ids, is_active, created_at, updated_at
       FROM line_groups 
       WHERE JSON_CONTAINS(line_ids, ?) AND is_active = TRUE`,
      [JSON.stringify(lineId)]
    );

    return rows.map((row: any) => this.mapRowToLineGroup(row));
  }

  /**
   * Get line group statistics
   */
  async getLineGroupStats(): Promise<{
    totalGroups: number;
    activeGroups: number;
    totalLines: number;
    avgLinesPerGroup: number;
  }> {
    const connection = await getConnection();
    
    const [rows] = await connection.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_groups,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_groups,
        SUM(JSON_LENGTH(line_ids)) as total_lines,
        AVG(JSON_LENGTH(line_ids)) as avg_lines_per_group
      FROM line_groups
    `);

    const stats = rows[0] as any;
    return {
      totalGroups: stats.total_groups || 0,
      activeGroups: stats.active_groups || 0,
      totalLines: stats.total_lines || 0,
      avgLinesPerGroup: parseFloat((stats.avg_lines_per_group || 0).toFixed(2))
    };
  }

  /**
   * Map database row to LineGroup interface
   */
  private mapRowToLineGroup(row: any): LineGroup {
    return {
      id: row.id,
      groupName: row.group_name,
      description: row.description || undefined,
      lineIds: JSON.parse(row.line_ids),
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Export singleton instance
export const lineGroupRepository = new LineGroupRepository();
