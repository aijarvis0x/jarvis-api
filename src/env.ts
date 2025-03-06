import env from "env-var"

export const ENCRYPTION_KEY = env.get("ENCRYPTION_KEY").required().asString()
export const JWT_SECRET_KEY = env
  .get("JWT_SECRET_KEY")
  .default(ENCRYPTION_KEY)
  .required()
  .asString()

/* DB */
export const BE_DATABASE_URL = env
  .get("BE_DATABASE_URL")
  .required()
  .asString()

export const PG_DISABLE_SSL = env.get("PG_DISABLE_SSL").asBool()
export const PG_MAX_CONNECTIONS = env
  .get("PG_MAX_CONNECTIONS")
  .default(20)
  .asIntPositive()
export const PG_CONNECTION_TIMEOUT = env
  .get("PG_CONNECTION_TIMEOUT")
  .default(10000)
  .asIntPositive()


/* Redis */
export const REDIS_HOST = env.get("REDIS_HOST").default("localhost").asString()
export const REDIS_PORT = env.get("REDIS_PORT").default("6379").asPortNumber()
export const REDIS_DB = env.get("REDIS_DB").asString()
export const REDIS_USERNAME = env.get("REDIS_USERNAME").asString()
export const REDIS_PASSWORD = env.get("REDIS_PASSWORD").asString()
export const REDIS_SOCKET = env.get("REDIS_SOCKET").asString()
export const REDIS_SENTINEL = env.get("REDIS_SENTINEL").asBool()
export const REDIS_PREDIX = env
  .get("REDIS_PREDIX")
  .default("wallet-app:")
  .asString()


export const USE_MARKET_REDIS_QUERY_CACHE = env
  .get("USE_MARKET_REDIS_QUERY_CACHE")
  .default(0)
  .asBool()

export const MARKET_FEE = env.get("MARKET_FEE").default(2000000).asFloat()
export const MINT_AI_FEE = env.get("MINT_AI_FEE").default(2000000).asFloat()


/* SUI */
export const MARKET_PACKAGE_ID = env
  .get("MARKET_PACKAGE_ID")
  .default(process.env.MARKET_PACKAGE_ID ?? "")
  // .required()
  .asString()

export const NFT_CONTRACT_ADDRESS = env
  .get("NFT_CONTRACT_ADDRESS")
  .default(process.env.NFT_CONTRACT_ADDRESS ?? "")
  .required()
  .asString()

export const AWS_SQS_CREATE_AI_AGENT = env.get("AWS_SQS_CREATE_AI_AGENT").default(process.env.AWS_SQS_CREATE_AI_AGENT ?? "").required().asString()
export const AWS_ACCESS_KEY = env.get("AWS_ACCESS_KEY").asString()
export const AWS_SECRET_ACCESS_KEY = env.get("AWS_SECRET_ACCESS_KEY").asString()
export const AWS_S3_BUCKET = env.get("AWS_S3_BUCKET").asString()
export const AWS_REGION = env.get("AWS_REGION").default(process.env.AWS_REGION ?? "").required().asString()


export const SERVER_5SON_AI_CORE = env.get("SERVER_5SON_AI_CORE").asString()
