import { Pool, type QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { BotState, Currency, OrderState } from "../constants.js"
import dayjs from "dayjs"
import { createEventHistory, createTransaction, findBotByNftId, findBotByOnlyNftId, findBotDelistableByNftId, updateBotLastestActOnchain, updateBotOwner, updateBotOwnerNotLastact, updateNftOwner } from "./bot.service.js"
import { buyOrder, cancelOrder, createOrder, CreateOrderParams, findOrderByOrderId, findOrderByTx, updateOrderState, updatePriceOrder } from "./order.service.js"
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
                
                let eventName = "Listed"
                //check transaction existed?
                let log = await createTransaction(pgClient, {
                    txHash: event?.transactionHash,
                    status: TxStatus.CONFIRMED,
                    sender: event?.address,
                    recipient: event.address,
                    nonce: Number(event.transactionIndex),
                    logIndex: Number(event.logIndex),
                    contractAddress: process.env.MARKET_CONTRACT_ADDRESS,
                    blockNumber: Number(event.blockNumber),
                    value: 0,
                    events: {
                        seller: event.returnValues.seller,
                        listingId: String(event?.returnValues?.listingId as bigint),
                        nftContract: event.returnValues.nftContract,
                        tokenId: String(event?.returnValues?.tokenId as bigint),
                        price: String(event?.returnValues?.price),
                        paymentToken: event.returnValues.paymentToken,
                    },
                    logs: { eventName: eventName },
                    confirmedAt: dayjs.utc().toDate(),
                })


                if (!log) {
                    throw new Error("transaction existed. Tx: " + String(event?.transactionHash))
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
                    price: String(event?.returnValues?.price),
                    fee: "0",
                    currency: Currency.MON,
                    confirmedAt: BigInt(event.blockNumber ?? 0)
                };

                order = await createOrder(pgClient, orderParams);

                await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0), pgClient)
                await createEventHistory(
                    pgClient,
                    {
                        event: undefined,
                        eventType: eventName,
                        userId: seller.id,
                        orderId: order.id,
                        botId: bot.id,
                        fromAddress: String(event.returnValues.seller),
                        toAddress: process.env.MARKET_CONTRACT_ADDRESS as string,
                        listingId: BigInt(event?.returnValues?.listingId as bigint)
                    }
                )

            } catch (error) {
                bail(new Error("Error during bot processing transaction:" + error));
                throw error;
            }
        })
}


export const reUpdateOwner = async (
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
                const bot = await findBotByOnlyNftId(String(event?.returnValues?.tokenId));
                if (!bot) {
                    throw new Error(`Bot doesn't exist or has been updated`);
                }

                const seller = await findUserByAddress(String(event?.returnValues?.seller), pgClient)
                if (!seller) {
                    throw new Error(`Seller doesn't exist`);
                }


                await updateBotOwnerNotLastact({
                    botId: bot.id,
                    userId: seller.id,
                    newOwner: String(event?.returnValues?.seller),
                    blockNumber: BigInt(event.blockNumber as bigint)
                }, pgClient)


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

                const order = await findOrderByOrderId(BigInt(event?.returnValues?.listingId as bigint))
                if (!order) {
                    throw new Error(`Order doesn't exist or has been updated`);
                }

                // Check if bot exists
                const bot = await findBotDelistableByNftId(order.nft_id, BigInt(event.blockNumber ?? 0));
                if (!bot) {
                    throw new Error(`Bot doesn't exist or has been updated`);
                }

                const seller = await findUserByAddress(order?.seller_address)
                if (!seller) {
                    throw new Error(`Seller doesn't exist`);
                }
                
                let eventName = "Cancelled"
                //check transaction existed?
                let log = await createTransaction(pgClient, {
                    txHash: event?.transactionHash,
                    status: TxStatus.CONFIRMED,
                    sender: event?.address,
                    recipient: event.address,
                    nonce: Number(event.transactionIndex),
                    logIndex: Number(event.logIndex),
                    contractAddress: process.env.MARKET_CONTRACT_ADDRESS,
                    blockNumber: Number(event.blockNumber),
                    value: 0,
                    events: {
                        listingId: String(event?.returnValues?.listingId as bigint)
                    },
                    logs: { eventName: eventName },
                    confirmedAt: dayjs.utc().toDate(),
                })


                if (!log) {
                    throw new Error("transaction existed. Tx: " + String(event?.transactionHash))
                }

                await cancelOrder(pgClient, BigInt(event?.returnValues?.listingId as bigint), String(event.transactionHash), BigInt(event.blockNumber ?? 0), String(event?.returnValues?.seller), seller.id);

                await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0), pgClient)

                await createEventHistory(
                    pgClient,
                    {
                        event: undefined,
                        eventType: eventName,
                        userId: seller.id,
                        orderId: order.id,
                        botId: bot.id,
                        fromAddress: process.env.MARKET_CONTRACT_ADDRESS as string,
                        toAddress: order?.seller_address as string,
                        listingId: String(event?.returnValues?.listingId as bigint)
                    }
                )
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

                const order = await findOrderByOrderId(BigInt(event?.returnValues?.listingId as bigint))
                if (!order) {
                    throw new Error(`Order doesn't exist or has been updated`);
                }

                // Check if bot exists
                const bot = await findBotDelistableByNftId(order.nft_id, BigInt(event.blockNumber ?? 0));
                if (!bot) {
                    throw new Error(`Bot doesn't exist or has been updated`);
                }

                const buyer = await findUserByAddress(String(event?.returnValues?.buyer))
                if (!buyer) {
                    throw new Error(`Buyer not exist`);
                }
                
                let eventName = "Sold"
                //check transaction existed?
                let log = await createTransaction(pgClient, {
                    txHash: event?.transactionHash,
                    status: TxStatus.CONFIRMED,
                    sender: event?.address,
                    recipient: event.address,
                    nonce: Number(event.transactionIndex),
                    logIndex: Number(event.logIndex),
                    contractAddress: process.env.MARKET_CONTRACT_ADDRESS,
                    blockNumber: Number(event.blockNumber),
                    value: 0,
                    events: {
                        buyer: event.returnValues.buyer,
                        listingId: String(event?.returnValues?.listingId as bigint),
                    },
                    logs: { eventName: eventName },
                    confirmedAt: dayjs.utc().toDate(),
                })


                if (!log) {
                    throw new Error("transaction existed. Tx: " + String(event?.transactionHash))
                }

                await updateBotOwner({
                    botId: bot.id,
                    userId: buyer.id,
                    newOwner: String(event.returnValues.buyer),
                    blockNumber: BigInt(event?.blockNumber as bigint)
                }, pgClient)

                await buyOrder(pgClient, BigInt(event?.returnValues?.listingId as bigint), String(event.transactionHash), BigInt(event.blockNumber ?? 0), String(event?.returnValues?.buyer), buyer.id);

                await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0), pgClient)
                await createEventHistory(
                    pgClient,
                    {
                        event: undefined,
                        eventType: eventName,
                        userId: buyer.id,
                        orderId: order.id,
                        botId: bot.id,
                        fromAddress: order?.seller_address as string,
                        toAddress: String(event.returnValues.buyer),
                        listingId: String(event?.returnValues?.listingId as bigint)
                    }
                )
            } catch (error) {
                bail(new Error("Error during bot processing transaction:" + error));
                throw error;
            }
        })
}

export const confirmItemUpdatePriceMarket = async (
    event: EventLog,
) => {
    //create bot
    await multiConnectionTransaction(
        [db.pool],
        async (bail, clients, mongoSession) => {
            try {
                const [pgClient] = clients;

                const order = await findOrderByOrderId(BigInt(event?.returnValues?.listingId as bigint))
                if (!order) {
                    throw new Error(`Order doesn't exist or has been updated`);
                }

                // Check if bot exists
                const bot = await findBotDelistableByNftId(order.nft_id, BigInt(event.blockNumber ?? 0));
                if (!bot) {
                    throw new Error(`Bot doesn't exist or has been updated`);
                }

                let eventName = "UpdatePrice"
                //check transaction existed?
                let log = await createTransaction(pgClient, {
                    txHash: event?.transactionHash,
                    status: TxStatus.CONFIRMED,
                    sender: event?.address,
                    recipient: event.address,
                    nonce: Number(event.transactionIndex),
                    logIndex: Number(event.logIndex),
                    contractAddress: process.env.MARKET_CONTRACT_ADDRESS,
                    blockNumber: Number(event.blockNumber),
                    value: 0,
                    events: {
                        listingId: String(event?.returnValues?.listingId as bigint),
                        oldPrice: String(event?.returnValues?.oldPrice),
                        newPrice: String(event?.returnValues?.newPrice),
                    },
                    logs: { eventName: eventName },
                    confirmedAt: dayjs.utc().toDate(),
                })


                if (!log) {
                    throw new Error("transaction existed. Tx: " + String(event?.transactionHash))
                }

                //update price order
                await updatePriceOrder(pgClient, order.order_id, BigInt(event.blockNumber ?? 0), String(event?.returnValues?.newPrice))


                await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0), pgClient)
                await createEventHistory(
                    pgClient,
                    {
                        event: undefined,
                        eventType: eventName,
                        userId: undefined,
                        orderId: order.id,
                        botId: bot.id,
                        fromAddress: order?.seller_address as string,
                        toAddress: process.env.MARKET_CONTRACT_ADDRESS as string,
                        listingId: String(event?.returnValues?.listingId as bigint)
                    }
                )
            } catch (error) {
                bail(new Error("Error during bot processing transaction:" + error));
                throw error;
            }
        })
}