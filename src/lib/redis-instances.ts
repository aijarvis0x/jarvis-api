import { Redis as IoRedis } from "ioredis"
import { getRedisClientOptions } from "./redis.js"

export const redisMarket = new IoRedis(
  getRedisClientOptions("Market", {
    db: process.env.MARKET_REDIS_DB ? Number(process.env.MARKET_REDIS_DB) : 2,
    enableAutoPipelining: true,
    keyPrefix: "market:",
  })
)

export const redisPub = new IoRedis(
  getRedisClientOptions("Market", {
    db: process.env.MARKET_REDIS_DB ? Number(process.env.MARKET_REDIS_DB) : 2,
  })
)

export const redisSub = new IoRedis(
  getRedisClientOptions("Market", {
    db: process.env.MARKET_REDIS_DB ? Number(process.env.MARKET_REDIS_DB) : 2,
  })
)
