import { Pool } from "pg";

let pool: Pool | null = null;

function getDatabaseUrl() {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured."
    );
  }

  return databaseUrl;
}

export function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString:
        getDatabaseUrl(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
}

export async function checkDatabaseConnection() {
  const result =
    await getDbPool().query<{
      server_time: string;
    }>(
      "select now()::text as server_time"
    );

  return result.rows[0];
}
