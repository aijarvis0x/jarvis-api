import type { QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { BotState, Currency, OrderState } from "../constants.js"
import dayjs from "dayjs"
import { createTransaction, findBotByNftId, findBotDelistableByNftId, updateBotLastestActOnchain, updateBotOwner } from "./bot.service.js"
import { buyOrder, cancelOrder, createOrder, CreateOrderParams, findOrderByIdKiosk, findOrderByTx, updateOrderState } from "./order.service.js"
import { MINT_AI_FEE } from "../env.js"
import { findUserByAddress } from "./users.service.js"
import { multiConnectionTransaction } from "../lib/db/transaction.js"
import { EventLog } from "web3"
import { TxStatus } from "../utils/monad-utils.js"


export const confirmItemListedMarket = async (
    event: EventLog,
) => {
    //create bot
    await multiConnectionTransaction(
        [db.pool],
        async (bail, clients, mongoSession) => {
            try {
                const [pgClient] = clients;
                console.log(event)
                // Check if bot exists
                const bot = await findBotByNftId(String(event?.returnValues?.tokenId), BigInt(event?.blockNumber ?? 0));
                if (!bot) {
                    throw new Error(`Bot doesn't exist or has been updated`);
                }

                const seller = await findUserByAddress(String(event?.returnValues?.seller))
                if (!seller) {
                    throw new Error(`Seller doesn't exist`);
                }
                //check order existed
                let order = await findOrderByTx(String(event?.transactionHash))

                if (order) {
                    throw new Error(`Order is existed`);
                }


                // Create order
                const orderParams: CreateOrderParams = {
                    botId: bot.id,
                    txHash: String(event?.transactionHash),
                    orderId: BigInt(event?.returnValues?.listingId as bigint),
                    sellerId: seller.id,
                    sellerAddress: String(event?.returnValues?.seller),
                    tag: bot.tag,
                    subTag: bot.sub_tag,
                    nftId: bot.nft_id,
                    price: BigInt(event?.returnValues?.price as bigint),
                    fee: 0,
                    currency: Currency.MON,
                    confirmedAt: BigInt(event.blockNumber ?? 0)
                };

                order = await createOrder(pgClient, orderParams);

                await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0), pgClient)

            } catch (error) {
                bail(new Error("Error during bot processing transaction:" + error));
                throw error;
            }
        })
}

export const confirmItemCancelledMarket = async (
    event: EventLog,
) => {
    //create bot
    await multiConnectionTransaction(
        [db.pool],
        async (bail, clients, mongoSession) => {
            try {
                const [pgClient] = clients;

                // Check if bot exists
                const bot = await findBotDelistableByNftId(String(event?.returnValues?.tokenId), BigInt(event.blockNumber ?? 0));
                if (!bot) {
                    throw new Error(`Bot doesn't exist or has been updated`);
                }

                const seller = await findUserByAddress(String(event?.returnValues?.seller))
                if (!seller) {
                    throw new Error(`Seller doesn't exist`);
                }

                //check transaction existed?
                let log = await createTransaction(pgClient, {
                    txHash: event?.transactionHash,
                    status: TxStatus.CONFIRMED,
                    sender: event?.returnValues?.owner,
                    recipient: event.address,
                    nonce: Number(event.transactionIndex),
                    logIndex: Number(event.logIndex),
                    contractAddress: process.env.NFT_CONTRACT_ADDRESS,
                    blockNumber: Number(event.blockNumber),
                    value: 0,
                    events: {
                        owner: event.returnValues.owner,
                        tokenId: Number(event?.returnValues?.tokenId),
                        agentType: Number(event.returnValues.agentType),
                        packageId: Number(event.returnValues.packageId)
                    },
                    logs: null,
                    confirmedAt: dayjs.utc().toDate(),
                })


                if (!log) {
                    throw new Error("transaction existed. Tx: " + String(event?.transactionHash))
                }

                await cancelOrder(pgClient, BigInt(event?.returnValues?.listingId as bigint), String(event.transactionHash), BigInt(event.blockNumber ?? 0), String(event?.returnValues?.seller), seller.id);

                await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0), pgClient)
            } catch (error) {
                bail(new Error("Error during bot processing transaction:" + error));
                throw error;
            }
        })
}

export const confirmItemSoldMarket = async (
    event: EventLog,
) => {
    //create bot
    await multiConnectionTransaction(
        [db.pool],
        async (bail, clients, mongoSession) => {
            try {
                const [pgClient] = clients;

                // Check if bot exists
                const bot = await findBotDelistableByNftId(String(event.id), BigInt(event.blockNumber ?? 0));
                if (!bot) {
                    throw new Error(`Bot doesn't exist or has been updated`);
                }

                const buyer = await findUserByAddress(String(event?.returnValues?.buyer))
                if (!buyer) {
                    throw new Error(`Buyer not exist`);
                }

                await updateBotOwner({
                    botId: bot.id,
                    userId: buyer.id
                })

                await buyOrder(pgClient, BigInt(event?.returnValues?.listingId as bigint), String(event.transactionHash), BigInt(event.blockNumber ?? 0), String(event?.returnValues?.buyer), buyer.id);

                await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0), pgClient)

            } catch (error) {
                bail(new Error("Error during bot processing transaction:" + error));
                throw error;
            }
        })
}