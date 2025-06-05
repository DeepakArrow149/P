import { getConnection } from './database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface BuyerData {
  id: string;
  buyerCode: string;
  buyerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  isActive?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BuyerFormValues {
  id?: string;
  buyerCode: string;
  buyerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  isActive?: boolean;
  notes?: string;
}

export class BuyerRepository {  // Check if buyer table exists (table already created by setup script)
  static async createTable(): Promise<void> {
    const connection = await getConnection();
    
    // Check if table exists with correct schema
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [process.env.DB_NAME || 'planner_react', 'buyers']
    ) as [RowDataPacket[], any];
    
    if (tables.length === 0) {
      throw new Error('Buyers table does not exist. Please run setup-database.js first.');
    }
  }
  // Get all buyers
  static async findAll(): Promise<BuyerData[]> {
    const connection = await getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, code as buyerCode, name as buyerName, contactPerson, email, phone, address, isActive, notes, createdAt, updatedAt FROM buyers ORDER BY createdAt DESC'
    );
      return rows.map(row => ({
      id: row.id,
      buyerCode: row.buyerCode,
      buyerName: row.buyerName,
      contactPerson: row.contactPerson || '',
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      country: '', // Not stored in new schema
      isActive: row.isActive || false,
      notes: row.notes || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
  // Get buyer by ID
  static async findById(id: string): Promise<BuyerData | null> {
    const connection = await getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, code as buyerCode, name as buyerName, contactPerson, email, phone, address, isActive, notes, createdAt, updatedAt FROM buyers WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      buyerCode: row.buyerCode,
      buyerName: row.buyerName,
      contactPerson: row.contactPerson || '',
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      country: '', // Not stored in new schema
      isActive: row.isActive || false,
      notes: row.notes || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
  // Get buyer by code
  static async findByCode(buyerCode: string): Promise<BuyerData | null> {
    const connection = await getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, code as buyerCode, name as buyerName, contactPerson, email, phone, address, isActive, notes, createdAt, updatedAt FROM buyers WHERE code = ?',
      [buyerCode]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      buyerCode: row.buyerCode,
      buyerName: row.buyerName,
      contactPerson: row.contactPerson || '',
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      country: row.country || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
  // Create new buyer
  static async create(buyerData: BuyerFormValues): Promise<BuyerData> {
    const connection = await getConnection();
    const id = buyerData.id || crypto.randomUUID();
    
    const insertQuery = `
      INSERT INTO buyers (id, code, name, contactPerson, email, phone, address, isActive, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute<ResultSetHeader>(insertQuery, [
      id,
      buyerData.buyerCode,
      buyerData.buyerName,
      buyerData.contactPerson || null,
      buyerData.email || null,
      buyerData.phone || null,
      buyerData.address || null,
      buyerData.isActive || true,
      buyerData.notes || null,
    ]);
    
    const createdBuyer = await this.findById(id);
    if (!createdBuyer) {
      throw new Error('Failed to create buyer');
    }
    
    return createdBuyer;
  }

  // Update buyer
  static async update(id: string, buyerData: BuyerFormValues): Promise<BuyerData> {
    const connection = await getConnection();
      const updateQuery = `
      UPDATE buyers 
      SET code = ?, name = ?, contactPerson = ?, email = ?, phone = ?, address = ?, isActive = ?, notes = ?
      WHERE id = ?
    `;
    
    const [result] = await connection.execute<ResultSetHeader>(updateQuery, [
      buyerData.buyerCode,
      buyerData.buyerName,
      buyerData.contactPerson || null,
      buyerData.email || null,
      buyerData.phone || null,
      buyerData.address || null,
      buyerData.isActive || true,
      buyerData.notes || null,
      id,
    ]);
    
    if (result.affectedRows === 0) {
      throw new Error('Buyer not found');
    }
    
    const updatedBuyer = await this.findById(id);
    if (!updatedBuyer) {
      throw new Error('Failed to update buyer');
    }
    
    return updatedBuyer;
  }

  // Delete buyer
  static async delete(id: string): Promise<boolean> {
    const connection = await getConnection();
    
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM buyers WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  }
  // Search buyers
  static async search(searchTerm: string): Promise<BuyerData[]> {
    const connection = await getConnection();
    const searchPattern = `%${searchTerm}%`;
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, code as buyerCode, name as buyerName, contactPerson, 
       email, phone, address, isActive, notes, createdAt, updatedAt 
       FROM buyers 
       WHERE name LIKE ? OR code LIKE ? OR contactPerson LIKE ?
       ORDER BY name`,
      [searchPattern, searchPattern, searchPattern]
    );
    
    return rows.map(row => ({
      id: row.id,
      buyerCode: row.buyerCode,
      buyerName: row.buyerName,
      contactPerson: row.contactPerson || '',
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      country: '', // Not stored in new schema
      isActive: row.isActive || false,
      notes: row.notes || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
  // Check if buyer code exists (for validation)
  static async codeExists(buyerCode: string, excludeId?: string): Promise<boolean> {
    const connection = await getConnection();
    let query = 'SELECT COUNT(*) as count FROM buyers WHERE code = ?';
    const params: any[] = [buyerCode];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    return rows[0].count > 0;
  }
}
