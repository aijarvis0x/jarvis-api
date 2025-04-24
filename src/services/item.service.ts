import { EventLog } from "web3";
import { db } from "../lib/pg.js";
import { MintItemNftEvent, TxStatus } from "../utils/monad-utils.js";
import { multiConnectionTransaction } from "../lib/db/transaction.js";
import { createTransaction } from "./bot.service.js";
import dayjs from "dayjs";
import { createUser, findUserByAddress } from "./users.service.js";
import { PoolClient } from "pg";
import { getItem } from "../config/items.js";

export async function getMyItems(userId: bigint) {
    try {
        let query = `
            SELECT
                *
            FROM items
            WHERE user_id = $1
        `;
        let values = [userId];

        let result = await db.pool.query(query, values);

        return result.rows;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createItem(
    pool: PoolClient,
    params: {
        nftId: string;
        ownerId: bigint;
        owner: string;
        agentType: number;
        packageId: number;
        blockNumber: bigint;
    }
) {
    try {
        const item = getItem(params.agentType)
        const insertQuery = `
            INSERT INTO items
            (
                category_ids, 
                name, 
                nft_id, 
                user_id, 
                owner, 
                lastest_act,
                img
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `;

        const values = [
            JSON.stringify([params.agentType]),
            item.name,
            params.nftId,
            params.ownerId,
            params.owner,
            params.blockNumber,
            item.img
        ];

        const result = await pool.query(insertQuery, values);
        const newItemId = result.rows[0].id;


        return BigInt(newItemId);
    } catch (error) {
        console.log(error);
    }
}

export const confirmedMintItem = async (
    txHash: string,
    event: MintItemNftEvent,
    eventLog: EventLog
) => {
    try {
        //create bot
        await multiConnectionTransaction(
            [db.pool],
            async (bail, clients, mongoSession) => {
                try {
                    const [pgClient] = clients;

                    //check transaction existed?
                    let log = await createTransaction(pgClient, {
                        txHash: eventLog?.transactionHash,
                        status: TxStatus.CONFIRMED,
                        sender: eventLog?.returnValues?.owner,
                        recipient: eventLog.address,
                        nonce: Number(eventLog.transactionIndex),
                        logIndex: Number(eventLog.logIndex),
                        contractAddress: process.env.ITEM_NFT_CONTRACT_ADDRESS,
                        blockNumber: Number(eventLog.blockNumber),
                        value: 0,
                        events: {
                            owner: eventLog.returnValues.owner,
                            tokenId: Number(eventLog?.returnValues?.tokenId),
                            agentType: Number(eventLog.returnValues.agentType),
                            packageId: Number(eventLog.returnValues.packageId),
                        },
                        logs: null,
                        confirmedAt: dayjs.utc().toDate(),
                    });

                    if (!log) {
                        throw new Error(
                            "transaction existed. Tx: " +
                                String(eventLog?.transactionHash)
                        );
                    }

                    let owner = await findUserByAddress(event.owner, pgClient);

                    if (!owner) {
                        owner = await createUser(String(event.owner), pgClient);
                    }

                    //create bot
                    const botId = await createItem(pgClient, {
                        nftId: String(event.tokenId),
                        owner: event.owner,
                        ownerId: BigInt(owner.id),
                        agentType: Number(event.agentType),
                        packageId: Number(event.packageId),
                        blockNumber: BigInt(eventLog.blockNumber ?? 0),
                    });
                    console.log("botId = ", botId);
                } catch (error) {
                    bail(
                        new Error(
                            "Error during item processing transaction:" + error
                        )
                    );
                    throw error;
                }
            }
        );
    } catch (error) {
        throw error;
    }
};
