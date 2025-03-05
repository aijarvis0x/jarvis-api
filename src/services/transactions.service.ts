import pg from "pg"
import { db } from "../lib/pg.js"
import type { ParsedMonadTransaction } from "../utils/monad-utils.js"

export async function logSuiTransactions(
  txs: Partial<ParsedMonadTransaction>[],
  _pool: pg.Pool = db.pool
) {
  const query = `
    INSERT INTO sui_transactions (status, tx_hash, sender, move_call, event0, event1, events, logs, confirmed_at)
    SELECT
      UNNEST($1::"OnChainStatus"[]), -- status
      UNNEST($2::text[]), -- tx_hash
      UNNEST($3::text[]), -- sender
      UNNEST($4::text[]), -- move_call
      UNNEST($5::text[]), -- event0
      UNNEST($6::text[]), -- event1
      UNNEST($7::jsonb[]), -- events
      UNNEST($8::jsonb[]), -- logs
      UNNEST($9::timestamp[]) -- confirmed_at
    ON CONFLICT (tx_hash) DO UPDATE
    SET
      status = EXCLUDED.status,
      sender = EXCLUDED.sender,
      move_call = EXCLUDED.move_call,
      event0 = EXCLUDED.event0,
      event1 = EXCLUDED.event1,
      logs = EXCLUDED.logs,
      confirmed_at = EXCLUDED.confirmed_at
    RETURNING id, tx_hash;
  `

  const statuses = txs.map((tx) =>
    !tx.status
      ? "confirming"
      : tx.status === "failure"
        ? "reverted"
        : "confirmed"
  )
  const txHashes = txs.map((tx) => tx.digest)
  const senders = txs.map((tx) => tx.sender ?? null)
  const moveCalls = txs.map((tx) => tx.moveCall ?? null)
  const events0 = txs.map((tx) => tx.event0 ?? null)
  const events1 = txs.map((tx) => tx.event1 ?? null)
  const events = txs.map((tx) => JSON.stringify(tx.events ?? null))
  const confirmedAts = txs.map((tx) => tx.confirmedAt ?? null)
  const logs = txs.map((tx) => {
    const _ac =
      (
        tx?.mintAiAgentEvent ||
        tx?.itemDelistedEvent ||
        tx?.itemListedEvent ||
        tx?.itemPurchasedEvent
      ) ?? null
    return _ac ? JSON.stringify(_ac) : null
  })

  const res = await _pool.query(query, [
    statuses,
    txHashes,
    senders,
    moveCalls,
    events0,
    events1,
    events,
    logs,
    confirmedAts,
  ])

  return res.rows as { id: bigint; tx_hash: string }[]
}
