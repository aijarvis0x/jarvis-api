import type {
  Checkpoint,
  SuiEventFilter,
  TransactionFilter,
} from "@mysten/sui/client"
import winston from "winston"
import {
  RateLimitedRPCRepository,
  type Options,
} from "./RateLimitedRPCRepository.js"
import type {
  Range,
  SuiRepository,
  SuiTransactionBlockReceipt,
} from "./types.js"

export class RateLimitedSuiJsonRPCBlockRepository
  extends RateLimitedRPCRepository<SuiRepository>
  implements SuiRepository
{
  constructor(
    delegate: SuiRepository,
    opts: Options = { period: 10_000, limit: 1000 }
  ) {
    super(delegate, opts)
    this.logger = winston.child({
      module: "RateLimitedSuiJsonRPCBlockRepository",
    })
  }

  getLastCheckpointNumber(): Promise<bigint> {
    return this.breaker
      .fn(() => this.delegate.getLastCheckpointNumber())
      .execute()
  }

  getCheckpoint(sequence: string | number | bigint): Promise<Checkpoint> {
    return this.breaker
      .fn(() => this.delegate.getCheckpoint(sequence))
      .execute()
  }

  getLastCheckpoint(): Promise<Checkpoint> {
    return this.breaker.fn(() => this.delegate.getLastCheckpoint()).execute()
  }

  getCheckpoints(range: Range): Promise<Checkpoint[]> {
    return this.breaker.fn(() => this.delegate.getCheckpoints(range)).execute()
  }

  getTransactionBlockReceipts(
    digests: string[]
  ): Promise<SuiTransactionBlockReceipt[]> {
    return this.breaker
      .fn(() => this.delegate.getTransactionBlockReceipts(digests))
      .execute()
  }

  queryTransactions(
    filter?: TransactionFilter | undefined,
    cursor?: string | undefined
  ): Promise<SuiTransactionBlockReceipt[]> {
    return this.breaker
      .fn(() => this.delegate.queryTransactions(filter, cursor))
      .execute()
  }

  queryTransactionsByEvent(
    filter: SuiEventFilter,
    cursor?: string | undefined
  ): Promise<SuiTransactionBlockReceipt[]> {
    return this.breaker
      .fn(() => this.delegate.queryTransactionsByEvent(filter, cursor))
      .execute()
  }
}
