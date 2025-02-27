import { bcs } from "@mysten/sui/bcs"
import type {
  SuiEvent,
  SuiTransactionBlockKind,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client"
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography"
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"
import * as env from "../env.js"
import { dayjs } from "../lib/date.js"
import type { SuiTransactionBlockReceipt } from "../scan/repositories/index.js"
import { MARKET_PACKAGE_ID } from "../env.js"

export type ParsedSuiTransaction = {
  status: "success" | "failure"
  digest: string
  sender: string
  moveCall: string
  event0: string
  event1?: string | null
  events?: SuiEvent[] | null | undefined
  confirmedAt: Date | null
  mintAiAgentEvent: SuiMintNftAiAgentEventStruct[] | null | undefined
  itemListedEvent: SuiItemListedEventStruct[] | null | undefined
  itemPurchasedEvent: SuiItemPurchasedEventStruct[] | null | undefined
  itemDelistedEvent: SuiItemDelistedEventStruct[] | null | undefined
}

export type SuiMintNftAiAgentEventStruct = (typeof MINT_NFT_EVENT_STRUCT)["$inferInput"]
export type SuiItemListedEventStruct = (typeof LISTED_NFT_EVENT_STRUCT)["$inferInput"]
export type SuiItemPurchasedEventStruct = (typeof PURCHASED_NFT_EVENT_STRUCT)["$inferInput"]
export type SuiItemDelistedEventStruct = (typeof DELISTED_NFT_EVENT_STRUCT)["$inferInput"]

export type SuiMsgMintAiAgentStruct =
  (typeof MSG_NFT_AI_AGENT_STRUCT)["$inferInput"]

export const MINT_NFT_EVENT_STRUCT = bcs.struct("MintedEvent", {
  user: bcs.Address,
  id: bcs.Address,
  xid: bcs.vector(bcs.U128),
  name: bcs.vector(bcs.U128),
  description: bcs.vector(bcs.U128),
})

// 0x2::kiosk::ItemListed<0x604d5a2093e8d9d95f32b9d0ae11e731c240194ef611d3898cd23def2d27dd66::agent_nft::AGENT>
// 0x2::kiosk::ItemPurchased<0x604d5a2093e8d9d95f32b9d0ae11e731c240194ef611d3898cd23def2d27dd66::agent_nft::AGENT>
// 0x2::kiosk::ItemDelisted<0x604d5a2093e8d9d95f32b9d0ae11e731c240194ef611d3898cd23def2d27dd66::agent_nft::AGENT>

export const LISTED_NFT_EVENT_STRUCT = bcs.struct("ItemListed", {
  id: bcs.Address,
  kiosk: bcs.Address,
  price: bcs.vector(bcs.U128)
})

export const PURCHASED_NFT_EVENT_STRUCT = bcs.struct("ItemPurchased", {
  id: bcs.Address,
  kiosk: bcs.Address,
  price: bcs.vector(bcs.U128)
})

export const DELISTED_NFT_EVENT_STRUCT = bcs.struct("ItemDelisted", {
  id: bcs.Address,
  kiosk: bcs.Address
})

export const MSG_NFT_AI_AGENT_STRUCT = bcs.struct("mintStruct", {
  receiver: bcs.Address,
  xid: bcs.vector(bcs.U8),
  name: bcs.vector(bcs.U8),
  description: bcs.vector(bcs.U8),
  mint_fee: bcs.U64,
  expire_timestamp: bcs.U64,
  nonce: bcs.U128,
})

const __RESOLVED_KEYPAIRS: Record<string, Ed25519Keypair> = {}

function resolveKeypair(privateKey: string) {
  if (__RESOLVED_KEYPAIRS[privateKey]) {
    return __RESOLVED_KEYPAIRS[privateKey]
  }

  const { secretKey } = decodeSuiPrivateKey(privateKey)
  __RESOLVED_KEYPAIRS[privateKey] = Ed25519Keypair.fromSecretKey(secretKey)

  return __RESOLVED_KEYPAIRS[privateKey]
}

export function generateNonce(id: bigint) {
  const now = dayjs.utc()

  return BigInt(`${String(id)}${now.valueOf()}`)
}

export function isMoveCall(transaction?: SuiTransactionBlockKind): boolean {
  return (
    typeof transaction !== "undefined" &&
    transaction?.kind === "ProgrammableTransaction" &&
    transaction?.transactions?.filter((t) => !!(t as any)?.MoveCall).length > 0
  )
}

export function getMoveCallFunc(transaction?: SuiTransactionBlockKind): string {
  if (!transaction || !("transactions" in transaction)) {
    return ""
  }

  const { MoveCall: moveCall } =
    (transaction as any).transactions?.find((tx) => !!tx.MoveCall) ?? {}

  // This should never happen
  if (!moveCall) {
    return ""
  }

  return `${moveCall?.package}::${moveCall?.module}::${moveCall?.function}`
}


export const signGenerateBotMsg = async (props: Omit<SuiMsgMintAiAgentStruct, "nonce"> & { id: bigint }) => {
  const nonce = generateNonce(props.id)
  const msgBytes = MSG_NFT_AI_AGENT_STRUCT.serialize({
    receiver: props.receiver,
    xid: Array.from(Buffer.from(String(props.xid))),
    name: Array.from(Buffer.from(String(props.name))),
    description: Array.from(Buffer.from(String(props.description))),
    mint_fee: props.mint_fee,
    expire_timestamp: props.expire_timestamp,
    nonce,
  }).toBytes()

  const signer = Ed25519Keypair.deriveKeypair(env.SUI_VALIDATOR_MNEMONIC);
  const signature = await signer.sign(msgBytes)

  return {
    msg: Buffer.from(msgBytes).toString("hex"),
    signature: Buffer.from(signature).toString("hex"),
    nonce: nonce,
    fee: props.mint_fee,
    expired_time: dayjs.utc(Number(props.expire_timestamp)).toDate()
  }
}

export function parseMintNftMessage(event: SuiEvent): SuiMintNftAiAgentEventStruct {
  const parsed = event.parsedJson as SuiMintNftAiAgentEventStruct
  return parsed
}

export function parseItemListedMessage(event: SuiEvent): SuiItemListedEventStruct {
  const parsed = event.parsedJson as SuiItemListedEventStruct
  return parsed
}
export function parseItemPurchasedtMessage(event: SuiEvent): SuiItemPurchasedEventStruct {
  const parsed = event.parsedJson as SuiItemPurchasedEventStruct
  return parsed
}
export function parseItemDelistedMessage(event: SuiEvent): SuiItemDelistedEventStruct {
  const parsed = event.parsedJson as SuiItemDelistedEventStruct
  return parsed
}

export function parseSuiTransaction(
  tx: SuiTransactionBlockResponse | SuiTransactionBlockReceipt
): ParsedSuiTransaction | null {
  const { digest, effects, transaction } = tx

  if (!isMoveCall(transaction?.data?.transaction)) {
    return null
  }

  const moveCall = getMoveCallFunc(transaction?.data?.transaction)
  const events = (tx.events ?? []).map((e) => e.type)

  //parse events
  const mintNftEvents: SuiMintNftAiAgentEventStruct[] = []
  const itemListedEvents: SuiItemListedEventStruct[] = []
  const itemPurchasedEvents: SuiItemPurchasedEventStruct[] = []
  const itemDelistedEvents: SuiItemDelistedEventStruct[] = []

  tx?.events?.map((event) => {
    switch (true) {
      case event.type.endsWith("MintedEvent"):
        mintNftEvents.push(parseMintNftMessage(event))
        break
      case event.type.endsWith(`0x2::kiosk::ItemListed<${MARKET_PACKAGE_ID}::agent_nft::AGENT>`):
        itemListedEvents.push(parseItemListedMessage(event))
        break
      case event.type.endsWith(`0x2::kiosk::ItemPurchased<${MARKET_PACKAGE_ID}::agent_nft::AGENT>`):
        itemPurchasedEvents.push(parseItemPurchasedtMessage(event))
        break
      case event.type.endsWith(`${MARKET_PACKAGE_ID}::marketplace::RemoveEvent`):
        itemDelistedEvents.push(parseItemDelistedMessage(event))
        break
      default:
        break
    }
  })

  return {
    digest: digest,
    sender: transaction?.data?.sender as string,
    status: effects?.status?.status === "failure" ? "failure" : "success",
    moveCall,
    event0: events[0] ?? "",
    event1: events[1] ?? null,
    events: tx?.events,
    confirmedAt: tx.timestampMs
      ? dayjs.utc(Number(tx.timestampMs)).toDate()
      : dayjs.utc().toDate(),
    mintAiAgentEvent: mintNftEvents,
    itemListedEvent: itemListedEvents ,
    itemPurchasedEvent: itemPurchasedEvents,
    itemDelistedEvent: itemDelistedEvents
  }
}
