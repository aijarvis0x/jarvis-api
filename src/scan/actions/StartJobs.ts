import { EventEmitter } from "node:events"
import { Redis } from "ioredis"
import winston from "winston"

import { getRedisClientOptions } from "../../lib/redis.js"

import { configuration } from "../config.js"
import {
  RateLimitedSuiJsonRPCBlockRepository,
  SuiJsonRPCBlockRepository,
} from "../repositories/index.js"
import type { SuiTransactionBlockReceipt } from "../repositories/types.js"
import { suiClient } from "../sui-client.js"
import {
  PollSuiTransactions,
  PollSuiTransactionsConfig,
} from "./PollSuiTransactions.js"
import { logSuiTransactions, parseSuiTransaction } from "./processer.js"
import { InMemoryMetadataStorage, RedisMetadataStorage } from "./storage.js"
import { confirmedMintBot } from "../../services/bot.service.js"
import { NFT_PACKAGE_ID } from "../../env.js"
import { confirmItemDelistedMarket, confirmItemListedMarket, confirmItemPurchasedMarket } from "../../services/market.service.js"

export class StartJobs {
  private readonly events: EventEmitter
  private readonly poll: PollSuiTransactions
  private runnables: Map<string, () => Promise<void>> = new Map()

  private readonly logger = winston.child({ module: "StartJobs" })

  constructor({
    packageId,
    initialBlock,
    storeDriver = process.env.METADATA_STORAGE
  }) {
    this.events = new EventEmitter()

    this.poll = new PollSuiTransactions(
      this.events,
      new PollSuiTransactionsConfig({
        id: "PollSuiTransactions",
        interval: Number(process.env.SUI_SCAN_INTERVAL || 2500),
        from: initialBlock,
        filter: {
          InputObject: packageId,
        },
      }),
      storeDriver === "redis"
        ? new RedisMetadataStorage(
          new Redis(
            getRedisClientOptions("SuiScan", {
              db: 1,
              keyPrefix:
                packageId === NFT_PACKAGE_ID
                  ? "SuiScan:"
                  : `SuiScan:${packageId}:`,
            })
          ),
          configuration.environment
        )
        : new InMemoryMetadataStorage(),
      new RateLimitedSuiJsonRPCBlockRepository(
        new SuiJsonRPCBlockRepository(suiClient)
      )
    )
  }

  public async run(): Promise<void> {
    this.runnables.set("PollSuiTransactions", () =>
      this.poll.run([(txs) => this.handle(txs)])
    )

    for (const [name, runner] of this.runnables) {
      this.logger.info(`Starting job: ${name}`)
      await runner()
    }
  }

  public async handle(txs: SuiTransactionBlockReceipt[]): Promise<void> {
    const items = txs
      .map((tx) => parseSuiTransaction(tx!))
      .filter((tx) => tx !== null)


    if (items.length) {
      this.logger.debug(
        `Found valid transactions: ${items.length} / ${txs.length}, processing...`
      )
    }

    await logSuiTransactions(items).catch((e) =>
      this.logger.error("Error logging transactions", e)
    )



    //switch
    for (const tx of items) {

      if(tx.digest == "8neS3HxL8Kfos3U86WjSAqhQctxemLbggxSfU9kZkDZw"){
        console.log(tx)
      }

      if (tx?.status !== "success") continue

      //switch to events market
      if (!!tx?.mintAiAgentEvent?.length) {
        await confirmedMintBot(tx?.mintAiAgentEvent, tx, this.logger)
          .then(() => {
            this.logger.debug(
              `confirmedMintBot done! - tx: ${tx?.digest} - xid (botId): ${String(tx.mintAiAgentEvent?.[0]?.xid)} - name: ${String(tx.mintAiAgentEvent?.[0]?.name)} - nftId: ${String(tx.mintAiAgentEvent?.[0]?.id)}`
            )
          })
          .catch((e) =>
            console.error(`confirmedMintBot error! tx: ${tx?.digest} - error`, e)
          )
      }
      if (!!tx?.itemListedEvent?.length) {
        await confirmItemListedMarket(tx?.itemListedEvent, tx, this.logger)
          .then(() => {
            this.logger.debug(
              `confirmItemListedMarket done! - tx: ${tx?.digest}`
            )
          })
          .catch((e) =>
            console.error(`confirmItemListedMarket error! tx: ${tx?.digest} - error`, e)
          )
      }
      if (!!tx?.itemPurchasedEvent?.length) {
        await confirmItemPurchasedMarket(tx?.itemPurchasedEvent, tx, this.logger)
          .then(() => {
            this.logger.debug(
              `confirmItemPurchasedMarket done! - tx: ${tx?.digest}`
            )
          })
          .catch((e) =>
            console.error(`confirmItemPurchasedMarket error! tx: ${tx?.digest} - error`, e)
          )
      }
      if (!!tx?.itemDelistedEvent?.length) {
        await confirmItemDelistedMarket(tx?.itemDelistedEvent, tx, this.logger)
          .then(() => {
            this.logger.debug(
              `confirmItemDelistedMarket done! - tx: ${tx?.digest}}`
            )
          })
          .catch((e) =>
            console.error(`confirmItemDelistedMarket error! tx: ${tx?.digest} - error`, e)
          )
      }

    }
  }

}
