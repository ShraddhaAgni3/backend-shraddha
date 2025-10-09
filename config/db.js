import pkg from 'pg';
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
     ssl: {
    rejectUnauthorized: false
  }
});

export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL. Current time:', result.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
};