import {
  BalanceChange,
  Checkpoint,
  ExecutionStatus,
  SuiEvent,
  SuiEventFilter,
  SuiTransactionBlock,
  TransactionFilter as SuiTransactionFilter,
} from "@mysten/sui/client"

export interface Range {
  from: bigint
  to: bigint
}

export interface SuiTransactionBlockReceipt {
  checkpoint: string
  digest: string
  effects?: { status?: ExecutionStatus }
  events: SuiEvent[]
  timestampMs: string
  transaction: SuiTransactionBlock
  balanceChanges: BalanceChange[]
}

export interface SuiRepository {
  getLastCheckpointNumber(): Promise<bigint>

  getCheckpoint(sequence: string | bigint | number): Promise<Checkpoint>

  getLastCheckpoint(): Promise<Checkpoint>

  getCheckpoints(range: Range): Promise<Checkpoint[]>

  getTransactionBlockReceipts(
    digests: string[]
  ): Promise<SuiTransactionBlockReceipt[]>

  queryTransactions(
    filter?: SuiTransactionFilter,
    cursor?: string
  ): Promise<SuiTransactionBlockReceipt[]>

  queryTransactionsByEvent(
    filter: SuiEventFilter,
    cursor?: string
  ): Promise<SuiTransactionBlockReceipt[]>
}

export interface StatRepository {
  count(id: string, labels: Record<string, any>, increase?: number): void

  measure(id: string, value: bigint | number, labels: Record<string, any>): void

  report: () => Promise<string>
}
