import pg, { type PoolConfig } from "pg"
import * as env from "../env.js"
import { dayjs } from "./date.js"

// Type parsers
pg.types.setTypeParser(pg.types.builtins.UUID, (x) => x)
pg.types.setTypeParser(pg.types.builtins.INT8, (x) => {
  return Number.isSafeInteger(Number(x)) ? BigInt(x) : x
})
pg.types.setTypeParser(pg.types.builtins.DATE, (x) => x)
pg.types.setTypeParser(pg.types.builtins.INTERVAL, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (x) => {
  if (dayjs(x).isValid()) {
    return dayjs.utc(x).toDate()
  }
  return x
})

pg.defaults.poolSize = env.PG_MAX_CONNECTIONS || 20
pg.defaults.parseInputDatesAsUTC = true

export interface InitPgReturn {
  pool: pg.Pool
  close: () => Promise<void>
}

export function initPg(config: Partial<PoolConfig>): InitPgReturn {
  let pool: pg.Pool | null = new pg.Pool({
    min: 0,
    max: env.PG_MAX_CONNECTIONS,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: env.PG_CONNECTION_TIMEOUT || 10000,
    query_timeout: process.env.PG_QUERY_TIMEOUT
      ? Number(process.env.PG_QUERY_TIMEOUT)
      : 10000,
    ssl: !env.PG_DISABLE_SSL ? { rejectUnauthorized: false } : false,
    // connectionString: env.BE_DATABASE_URL,
    ...config,
  })

  return {
    async close() {
      const _pool = pool
      pool = null
      // Gracefully wait for active connections to be idle, then close all
      // connections in the pool.
      if (_pool) await _pool.end()
    },

    get pool() {
      if (!pool) {
        throw new Error("pg_pool is already closed")
      }

      return pool
    },
  }
}

export const db = initPg({
  connectionString: env.BE_DATABASE_URL,
})

const replicas = [
  new pg.Pool({
    connectionString: env.BE_DATABASE_URL,
    min: 10,
    max: env.PG_MAX_CONNECTIONS,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: env.PG_CONNECTION_TIMEOUT || 5000,
    ssl: !env.PG_DISABLE_SSL ? { rejectUnauthorized: false } : false,
  })
]

// console.log(replicas)

export function getReplicaPool(): pg.Pool {
  return replicas[0]
}
