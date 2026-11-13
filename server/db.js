require('./env');
const { Pool, Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set in environment (.env.local / .env).');
}

// Per neon-postgres skill:
// Use Pooled connection (DATABASE_URL with -pooler) for application query traffic
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Neon Postgres client:', err.message);
});

/**
 * Per neon-postgres skill:
 * Use Direct/Unpooled connection (DATABASE_URL_UNPOOLED) for schema migrations / DDL
 */
async function initDbSchema() {
  const migrationConnStr = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const client = new Client({ connectionString: migrationConnStr });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name_ru TEXT NOT NULL,
        name_uz TEXT NOT NULL,
        icon TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name_ru TEXT NOT NULL,
        name_uz TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        price_uzs BIGINT NOT NULL,
        old_price_uzs BIGINT,
        image TEXT NOT NULL,
        in_stock INTEGER DEFAULT 10,
        specs_json TEXT NOT NULL,
        description_ru TEXT,
        description_uz TEXT,
        is_popular INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_popular ON products(is_popular DESC, price_uzs DESC);

      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        genre_ru TEXT NOT NULL,
        genre_uz TEXT NOT NULL,
        year INTEGER NOT NULL,
        cover_image TEXT NOT NULL,
        base_fps_1080p_high REAL NOT NULL,
        gpu_weight REAL DEFAULT 0.75,
        cpu_weight REAL DEFAULT 0.25,
        ram_rec_gb INTEGER DEFAULT 16,
        description_ru TEXT,
        description_uz TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        telegram_username TEXT,
        total_uzs BIGINT NOT NULL,
        items_json TEXT NOT NULL,
        build_specs_json TEXT,
        receipt_key TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        telegram_sent BOOLEAN DEFAULT FALSE,
        telegram_error TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    `);

    // Ensure columns exist if table was created earlier
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_key TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_filename TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_mime_type TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_sent BOOLEAN DEFAULT FALSE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_error TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'receipt';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_url TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_url TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_pdf TEXT;
    `);
  } finally {
    await client.end();
  }
}

async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res;
}

module.exports = {
  pool,
  query,
  initDbSchema
};
