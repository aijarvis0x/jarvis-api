import * as env from "../env.js"
import { dayjs } from "../lib/date.js"
import { MARKET_PACKAGE_ID } from "../env.js"
import { ethers } from "ethers";

export enum TxStatus {
  PENDING = "pending",
  CONFIRMING = "confirming",
  CONFIRMED = "confirmed",
  REVERTED = "reverted"
}

export type ParsedMonadTransaction = {
  status: TxStatus
  txHash: string
  sender: string
  contractAddress: string
  recipient: string
  blockNumber: bigint
  nonce: bigint
  value: bigint,
  timestamp: bigint
  events?: [Object] | null | undefined
  confirmedAt: Date | null
}

export type MintNftEvent = {
  owner: string,
  tokenId: string,
  agentType: number,
  packageId: number
}


// export function parseMonadTransaction(
//   tx: any
// ): ParsedMonadTransaction | null {


//   return {

//   }
// }
