import type P from "pino"
import { pino } from "pino"

/**
 * Types from Pino
 * @see https://github.com/pinojs/pino/blob/master/pino.d.ts
 */
export type Logger = P.Logger
export type LevelWithSilent = P.LevelWithSilent
export type LoggerOptions = P.LoggerOptions

const isTest = process.env.NODE_ENV === "test"
const isDevelopment = process.env.NODE_ENV === "development"
const isProduction = !isDevelopment && !isTest

/**
 * List of keys to redact from log
 *
 * As an array, the redact option specifies paths that should have their values redacted from any log output.
 */
export const redactionsList: string[] = [
  "access_token",
  "data.access_token",
  "data.*.access_token",
  "data.*.accessToken",
  "accessToken",
  "data.accessToken",
  "BE_DATABASE_URL",
  "data.*.email",
  "data.email",
  "email",
  "event.headers.authorization",
  "data.hashedPassword",
  "data.*.hashedPassword",
  "hashedPassword",
  "host",
  "jwt",
  "data.jwt",
  "data.*.jwt",
  "JWT",
  "data.JWT",
  "data.*.JWT",
  "password",
  "data.password",
  "data.*.password",
  "params",
  "data.salt",
  "data.*.salt",
  "salt",
  "secret",
  "data.secret",
  "data.*.secret",
]

export const logLevel: LevelWithSilent | string = (() => {
  switch (true) {
    case typeof process.env.LOG_LEVEL !== "undefined":
      return process.env.LOG_LEVEL
    case isProduction:
      return "info"
    case isTest:
      return "silent"
    default:
      return "trace"
  }
})()

export const defaultLoggerOptions = {
  level: logLevel,
  redact: redactionsList,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "HH:MM:ss",
    },
  },
} satisfies LoggerOptions

export const createLogger = (name: string, options?: LoggerOptions): Logger =>
  pino({
    name: options?.name || name,
    enabled: process.env.DISABLE_LOGGING !== "true",
    ...(options || defaultLoggerOptions),
  })

export const logger = createLogger("App")
