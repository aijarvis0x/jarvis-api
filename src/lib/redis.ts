import { Redis as IoRedis, type RedisOptions } from "ioredis"
import * as env from "../env.js"
import { logger, type Logger } from "./logger.js"

/* Helpers */
const isUseRedisSentinel = (): boolean => Boolean(env.REDIS_SENTINEL)

export function getRedisClientOptions(
  name?: string,
  options: RedisOptions = {}
): RedisOptions {
  const connectionName = ["App", name].join("")
  const connectTimeout = 20000

  if (isUseRedisSentinel()) {
    throw new Error("REDIS_SENTINEL is not implements at moment")

    /* return {
      connectionName,
      connectTimeout,
      enableTLSForSentinelMode: CONFIG.REDIS.SENTINEL.ENABLE_TLS,
      sentinelPassword: CONFIG.REDIS.AUTH,
      sentinels: CONFIG.REDIS.SENTINEL.SENTINELS,
      name: CONFIG.REDIS.SENTINEL.MASTER_NAME,
      ...options,
    } */
  }

  return {
    connectionName,
    connectTimeout,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB ? Number(env.REDIS_DB) : undefined,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    path: env?.REDIS_SOCKET ?? undefined,
    showFriendlyErrorStack: true,
    ...options,
  }
}

/**
 * Check whether the maxmemory-policy config is set to noeviction
 *
 * BullMQ requires this setting in redis
 * For details, see: https://docs.bullmq.io/guide/connections
 */
export const isMaxmemoryPolicyNoeviction = async (): Promise<boolean> => {
  let redis: IoRedis | undefined

  try {
    redis = new IoRedis(getRedisClientOptions())

    const maxmemoryPolicyConfig = (await (redis as IoRedis).config(
      "GET",
      "maxmemory-policy"
    )) as string[]

    console.debug({ maxmemoryPolicyConfig }, "Got maxmemory-policy config")

    if (
      maxmemoryPolicyConfig.length === 2 &&
      "maxmemory-policy" === maxmemoryPolicyConfig[0] &&
      "noeviction" === maxmemoryPolicyConfig[1]
    ) {
      return true
    }
  } finally {
    if (redis !== undefined) {
      redis.disconnect()
    }
  }

  return false
}

/* Main class */
export class Redis {
  private static instance: Redis
  private initialized = false
  private connected = false

  private client!: IoRedis
  private prefix!: string

  private readonly logger: Logger = logger.child({ module: "redis" })

  static get Instance() {
    return this.instance || (this.instance = new this())
  }

  init() {
    // Already initialized
    if (this.initialized) return
    this.initialized = true

    const redisMode = isUseRedisSentinel() ? "sentinel" : "standalone"
    this.logger.info(`Connecting to redis ${redisMode}...`)

    this.client = new IoRedis(
      getRedisClientOptions("", {
        db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 1,
        enableAutoPipelining: true,
      })
    )

    this.client.on("error", (err) => {
      this.logger.error("Redis failed to connect", { err })
      // process.exit(1)
    })

    this.client.on("connect", () => {
      this.logger.info("Connected to redis.")
      this.connected = true
    })

    this.client.on("reconnecting", (ms) => {
      this.logger.error(`Reconnecting to redis in ${ms}.`)
    })

    this.client.on("close", () => {
      this.logger.error("Connection to redis has closed.")
      this.connected = false
    })

    this.client.on("end", () => {
      this.logger.error(
        "Connection to redis has closed and no more reconnects will be done."
      )
    })

    this.prefix = env.REDIS_PREDIX || "redis-app-"
  }

  close() {
    if (!this.connected) return
    this.client.quit()
    this.connected = false
  }

  getClient() {
    return this.client
  }

  getPrefix() {
    return this.prefix
  }

  isConnected() {
    return this.connected
  }

  /* ************ Redis helpers ************ */

  getValue(key: string) {
    return this.client.get(this.prefix + key)
  }

  getSet(key: string) {
    return this.client.smembers(this.prefix + key)
  }

  addToSet(key: string, value: string) {
    return this.client.sadd(this.prefix + key, value)
  }

  deleteFromSet(key: string, value: string) {
    return this.client.srem(this.prefix + key, value)
  }

  deleteKey(key: string) {
    return this.client.del(this.prefix + key)
  }

  async getObject(key: string) {
    const value = await this.getValue(key)
    if (!value) return null

    return JSON.parse(value)
  }

  setObject(
    key: string,
    value: Record<string, unknown>,
    expirationMilliseconds?: number
  ) {
    return this.setValue(key, JSON.stringify(value), expirationMilliseconds)
  }

  async setValue(key: string, value: string, expirationMilliseconds?: number) {
    const result =
      expirationMilliseconds !== undefined
        ? await this.client.set(
            this.prefix + key,
            value,
            "PX",
            expirationMilliseconds
          )
        : await this.client.set(this.prefix + key, value)

    if (result !== "OK") throw new Error("Redis set result is not OK.")
  }

  removeValue(key: string) {
    return this.client.del(this.prefix + key)
  }

  increment(key: string) {
    return this.client.incr(this.prefix + key)
  }

  async exists(key: string) {
    const result = await this.client.exists(this.prefix + key)

    return result !== 0
  }

  setExpiration(key: string, ms: number) {
    return this.client.expire(this.prefix + key, ms / 1000)
  }
}
