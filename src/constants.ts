/* Core */
import { root } from "./paths.js"
import { parseFileToArraySync } from "./utils/fs-utils.js"

export const ACCESS_TOKEN_EXPIRED_TIME = 86400

export const DECIMALS = 9

/* TTLs */
export const REDIS_USER_TTL = 300_000 // 5 minutes

/* Accounts */
export const BLOCK_ACCOUNT_IDS = parseFileToArraySync(
  `${root()}/configs/block-accounts.txt`
)

/* SUI */
export const LOG_MOVE_CALLS = [

]

export const BLOCK_BUY_IDS = parseFileToArraySync(
  `${root()}/configs/lock-buy-ids.txt`
)

export enum BotState {
  Confirmed = 'confirmed',
  WaitingGenerate = 'waiting_generate',
  Created = 'created'
}

export enum Currency {
  MON = 'MON',
  _5SON = 'SON',
}

export enum OrderState {
  Listed = 'listed',
  Cancelled = 'cancelled',
  Sold = 'sold'
}