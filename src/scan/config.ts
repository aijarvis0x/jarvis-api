import env from "env-var"

export type Environment = "testnet" | "mainnet"
export type LogLevel = "debug" | "info" | "warn" | "error"

export type Config = {
  environment: Environment
  logLevel: LogLevel
}

export const configuration = {
  environment: process.env.SUI_CHAIN === "testnet" ? "testnet" : "mainnet",
  logLevel: "debug",
} as Config


