
import { PoolClient, QueryConfig } from "pg";
import { db } from "../lib/pg.js";
import { OrderState } from "../constants.js";


export interface CreateOrderParams {
    botId: bigint;
    orderId: bigint;
    sellerId: number;
    sellerAddress: string;
    tag: string;
    nftId: string;
    price: bigint;
    currency: string;
    subTag?: string;
    fee?: number;
    buyerId?: number;
    buyerAddress?: string;
    txHash: string;
    confirmedAt: bigint
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
        text: "SELECT * FROM orders WHERE bot_id = $1 AND kiosk = $2 AND state = 'listed' LIMIT 1",
        values: [botId, kiosk],
    }

    return await db.pool.query(statement)
        .then((result) => result.rows?.[0] ?? null)
}

export const findOrderListedOfBot = async (botId: bigint) => {
    const statement: QueryConfig = {
        name: "findOrderListedOfBot",
        text: "SELECT * FROM orders WHERE bot_id = $1 AND state = 'listed' LIMIT 1",
        values: [botId],
    }

    return await db.pool.query(statement)
        .then((result) => result.rows?.[0] ?? null)
}

export const findOrderOfBots = async (bots: bigint[]) => {
    const statement: QueryConfig = {
        name: "findOrderOfBots",
        text: "SELECT * FROM orders WHERE bot_id = ANY($1) LIMIT 1",
        values: [bots],
    }

    return await db.pool.query(statement)
        .then((result) => result.rows?.[0] ?? null)
}




export const createOrder = async (pool: PoolClient, params: CreateOrderParams) => {

    try{
        const insertQuery = `
            INSERT INTO orders (
                order_id, seller_id, seller_address, tag, sub_tag, nft_id, price, fee, currency, buyer_id, buyer_address, state, created_at, updated_at, tx_hash, bot_id, lastest_act
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'listed', NOW(), NOW(), $12, $13, $14
            ) RETURNING *;
        `;

        const values = [
            params.orderId,
            params.sellerId,
            params.sellerAddress,
            params.tag,
            params.subTag || null,
            params.nftId,
            params.price,
            params.fee || null,
            params.currency,
            params.buyerId || null,
            params.buyerAddress || null,
            params.txHash,
            params.botId,
            params.confirmedAt
        ];

        const result = await pool.query(insertQuery, values);


        return result.rows[0];
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

export const cancelOrder = async (pool: PoolClient, orderId: bigint, txHash: string, confirmedAt: bigint, owner: string, userId: bigint) => {
    const updateQuery = `
        UPDATE orders
        SET state = $1, updated_at = NOW(), lastest_act = $2, tx_hash_delist = $3, seller_address = $4, seller_id = $5
        WHERE order_id = $6 AND state = 'listed'
        RETURNING *;
    `;
    const values = [OrderState.Cancelled, confirmedAt, txHash, owner, userId, orderId];

    return await pool.query(updateQuery, values);
}

export const buyOrder = async (pool: PoolClient, orderId: bigint, txHash: string, confirmedAt: bigint, buyer: string, buyerId: bigint) => {
    const updateQuery = `
        UPDATE orders
        SET state = $1, updated_at = NOW(), lastest_act = $2, sold_at = $3, tx_hash_sold = $4, buyer_address = $5, buyer_id = $6
        WHERE orderId = $6 AND state = 'listed'
        RETURNING *;
    `;
    const values = [OrderState.Sold, confirmedAt, confirmedAt, txHash, buyer, buyerId, orderId];


    return await pool.query(updateQuery, values);
}

export const updateOrderState = async (nftId: string, kiosk: string, newState: string) => {
    const updateQuery = `
        UPDATE orders
        SET state = $1, updated_at = NOW()
        WHERE nft_id = $2 AND kiosk = $3 AND state = 'listed'
        RETURNING *;
    `;
    const values = [newState, nftId, kiosk];

    return await db.pool.query(updateQuery, values);
}

export const updateBotState = async (nftId: string, newState: string) => {
    const updateQuery = `
        UPDATE bots
        SET state = $1, updated_at = NOW()
        WHERE nft_id = $2
        RETURNING *;
    `;
    const values = [newState, nftId];

    return await db.pool.query(updateQuery, values);
}
