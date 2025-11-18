import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

async function runMigration(filename) {
  try {
    console.log(`📦 Running migration: ${filename}`);

    const migrationPath = path.join(__dirname, 'migrations', filename);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`❌ Error running migration ${filename}:`, error.message);
    throw error;
  }
}

// Run the migration
runMigration('006_add_teacher_to_classes.sql')
  .then(() => {
    console.log('🎉 All migrations completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
