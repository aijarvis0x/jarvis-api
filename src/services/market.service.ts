import type { QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { BotState, Currency, OrderState } from "../constants.js"
import dayjs from "dayjs"
import { findBotByNftId, findBotDelistableByNftId, updateBotLastestActOnchain, updateBotOwner } from "./bot.service.js"
import { buyOrder, cancelOrder, createOrder, CreateOrderParams, findOrderByIdKiosk, findOrderByTx, updateOrderState } from "./order.service.js"
import { MINT_AI_FEE } from "../env.js"
import { findUserByAddress } from "./users.service.js"
import { multiConnectionTransaction } from "../lib/db/transaction.js"
import { EventLog } from "web3"


export const confirmItemListedMarket = async (
    event: EventLog,
) => {
    try {
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

        order = await createOrder(orderParams);

        await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0))

    } catch (error) {
        console.error('Error confirming item listed on market:', error);
        throw error;
    }
}


export const confirmItemCancelledMarket = async (
    event: EventLog,
) => {
    try {

        // Check if bot exists
        const bot = await findBotDelistableByNftId(String(event?.returnValues?.tokenId), BigInt(event.blockNumber ?? 0));
        if (!bot) {
            throw new Error(`Bot doesn't exist or has been updated`);
        }

        const seller = await findUserByAddress(String(event?.returnValues?.seller))
        if (!seller) {
            throw new Error(`Seller doesn't exist`);
        }

        await cancelOrder(BigInt(event?.returnValues?.listingId as bigint), String(event.transactionHash), BigInt(event.blockNumber ?? 0), String(event?.returnValues?.seller), seller.id);

        await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0))

    } catch (error) {
        console.error('Error confirming item delisted from market:', error);
        throw error;
    }
};

export const confirmItemSoldMarket = async (
    event: EventLog,
) => {
    try {

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

        await buyOrder(BigInt(event?.returnValues?.listingId as bigint), String(event.transactionHash), BigInt(event.blockNumber ?? 0), String(event?.returnValues?.buyer), buyer.id);

        await updateBotLastestActOnchain(bot.id, BigInt(event.blockNumber ?? 0))

    } catch (error) {
        console.error('Error confirming item purchased from market:', error);
        throw error;
    }
};