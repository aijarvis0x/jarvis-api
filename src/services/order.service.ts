
import { QueryConfig } from "pg";
import { db } from "../lib/pg.js";
import { OrderState } from "../constants.js";


export interface CreateOrderParams {
    botId: bigint;
    sellerId: number;
    sellerAddress: string;
    tag: string;
    nftId: string;
    kiosk: string;
    price: bigint;
    currency: string;
    subTag?: string;
    fee?: number;
    buyerId?: number;
    buyerAddress?: string;
    txHash: string;
    confirmedAt: Date | null
}

export const findOrderByTx = async (txHash: string) => {
  const statement: QueryConfig = {
    name: "findOrderByTx",
    text: "SELECT * FROM orders WHERE tx_hash = $1 LIMIT 1",
    values: [txHash],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

export const findOrderByIdKiosk = async (botId: bigint, kiosk: string) => {
    const statement: QueryConfig = {
      name: "findOrderByIdKiosk",
      text: "SELECT * FROM orders WHERE botId = $1 AND kiosk = $2 AND state = 'listed' LIMIT 1",
      values: [botId, kiosk],
    }

    return await db.pool.query(statement)
      .then((result) => result.rows?.[0] ?? null)
  }



export const createOrder = async (params: CreateOrderParams) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO orders (
                seller_id, seller_address, tag, sub_tag, nft_id, kiosk, price, fee, currency, buyer_id, buyer_address, state, created_at, updated_at, tx_hash, bot_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'listed', NOW(), $12, $13, $14
            ) RETURNING *;
        `;

        const values = [
            params.sellerId,
            params.sellerAddress,
            params.tag,
            params.subTag || null,
            params.nftId,
            params.kiosk,
            params.price,
            params.fee || null,
            params.currency,
            params.buyerId || null,
            params.buyerAddress || null,
            params.confirmedAt,
            params.txHash,
            params.botId
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        throw error;
    } finally {
        client.release();
    }
}

export const cancelOrder = async(nftId: string, kiosk: string, txHash: string, confirmedAt: Date | null, owner: string, userId: bigint) => {
    const updateQuery = `
        UPDATE orders
        SET state = $1, updated_at = $2, tx_hash_delist = $3, seller_address = $4, seller_id = $5
        WHERE nft_id = $6 AND kiosk = $7 AND state = 'listed'
        RETURNING *;
    `;
    const values = [OrderState.Cancelled, confirmedAt, txHash, owner, userId, nftId, kiosk];

    return await db.pool.query(updateQuery, values);
}

export const buyOrder = async (nftId: string, kiosk: string | any, txHash: string, confirmedAt: Date | null, buyer: string, buyerId: bigint) => {
    const updateQuery = `
        UPDATE orders
        SET state = $1, updated_at = $2, sold_at = $2, tx_hash_purchase = $3, buyer_address = $4, buyer_id = $5
        WHERE nft_id = $6 AND kiosk = $7 AND state = 'listed'
        RETURNING *;
    `;
    const values = [OrderState.Purchased, confirmedAt, txHash, buyer, buyerId, nftId, kiosk];
    

    return await db.pool.query(updateQuery, values);
}

export const updateOrderState = async(nftId: string, kiosk: string, newState: string) => {
    const updateQuery = `
        UPDATE orders
        SET state = $1, updated_at = NOW()
        WHERE nft_id = $2 AND kiosk = $3 AND state = 'listed'
        RETURNING *;
    `;
    const values = [newState, nftId, kiosk];

    return await db.pool.query(updateQuery, values);
}

export const updateBotState = async(nftId: string, newState: string) => {
    const updateQuery = `
        UPDATE bots
        SET state = $1, updated_at = NOW()
        WHERE nft_id = $2
        RETURNING *;
    `;
    const values = [newState, nftId];

    return await db.pool.query(updateQuery, values);
}
