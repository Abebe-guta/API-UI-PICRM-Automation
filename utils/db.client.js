// =============================================================
// utils/db.client.js
// LAYER  : Utils — database connection and query helpers
// RULE   : NO business logic. Connection management only.
// USED BY: db/queries/, fixtures/base.fixture.js
// =============================================================

import pg from 'pg';
const { Pool } = pg;

let pool = null;

export function getDbClient() {
  if (!pool) {
    pool = new Pool({
      host:     process.env.DB_HOST,
      port:     Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const result = await getDbClient().query(sql, params);
  return result.rows;
}

export async function rows(sql, params = []) {
  return query(sql, params);
}

export async function closeDbClient() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}