import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'planner_react',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Removed invalid acquireTimeout and timeout options for mysql2
  // These options are not supported by mysql2 and cause warnings
};

// Create a connection pool
let pool: mysql.Pool | null = null;

export const getConnection = async (): Promise<mysql.Pool> => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Get a single connection for transactions
export const getTransactionConnection = async (): Promise<mysql.PoolConnection> => {
  const poolInstance = await getConnection();
  return await poolInstance.getConnection();
};

export const closeConnection = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
