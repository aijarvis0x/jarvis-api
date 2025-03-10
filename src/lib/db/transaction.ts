import retry from "async-retry"
import { ClientSession, MongoClient } from "mongodb"
import type { Pool, PoolClient } from "pg"
import { DatabaseError } from "pg-protocol"
import { type Logger } from "../logger.js"

export async function multiConnectionTransaction<T = any>(
  pools: Pool[],
  callback: (
    bail: (err: Error) => void,
    clients: PoolClient[],
    mongoSession: ClientSession
  ) => Promise<T>,
  mongo?: MongoClient,
  options?: {
    logger?: Logger
  }
): Promise<T> {
  const logger = options?.logger ?? console

  const run = async (bail: (err: Error) => void): Promise<T> => {
    const clients = await Promise.all(pools.map((pool) => pool.connect()))
    const mongoSession = mongo?.startSession()

    try {
      mongoSession?.startTransaction()
      await Promise.all(clients.map((client) => client.query("BEGIN")))

      const result = await callback(
        bail,
        clients,
        (mongoSession ?? undefined) as ClientSession
      )

      await mongoSession?.commitTransaction()
      await Promise.all(clients.map((client) => client.query("COMMIT")))

      return result as T
    } catch (error) {
      await mongoSession?.abortTransaction()
      await Promise.all(clients.map((client) => client.query("ROLLBACK")))
      throw error
    } finally {
      mongoSession?.endSession()
      for (const client of clients) {
        client.release()
      }
    }
  }

  return (await retry(
    async (bail) => {
      try {
        return run(bail)
      } catch (e) {
        if (
          e instanceof DatabaseError &&
          e.code === "08P01" &&
          e.message.includes("no more connections allowed")
        ) {
          throw e
        }

        bail(e as Error)
      }
    },
    {
      retries: 0,
      minTimeout: 50,
      maxTimeout: 200,
      maxRetryTime: 3000,
      onRetry: (e, attempt) => {
        logger?.warn(
          `db.multiConnectionTransaction retry attempt ${attempt}. Error: ${e}`
        )
      },
    }
  )) as T
}
