import type { QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { BotState, Currency, OrderState } from "../constants.js"
import { ParsedSuiTransaction, SuiItemDelistedEventStruct, SuiItemListedEventStruct, SuiItemPurchasedEventStruct } from "../utils/sui-utils.js"
import dayjs from "dayjs"
import { findBotByNftId, findBotDelistableByNftId, updateBotLastestActOnchain, updateBotOwner } from "./bot.service.js"
import { buyOrder, cancelOrder, createOrder, CreateOrderParams, findOrderByIdKiosk, findOrderByTx, updateOrderState } from "./order.service.js"
import { MINT_AI_FEE } from "../env.js"
import { findUserByAddress } from "./users.service.js"
import { multiConnectionTransaction } from "../lib/db/transaction.js"


export const confirmItemListedMarket = async (
    events: SuiItemListedEventStruct[],
    tx: ParsedSuiTransaction,
    logger: any
) => {
    try {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            console.log(event)
            // Check if bot exists
            const bot = await findBotByNftId(String(event.id), tx.confirmedAt);
            if (!bot) {
                throw new Error(`Bot doesn't exist or has been updated`);
            }

            //check order existed
            let order = await findOrderByTx(tx.digest)

            if (order) {
                throw new Error(`Order is existed`);
            }


            // Create order
            const orderParams: CreateOrderParams = {
                botId: bot.id,
                txHash: tx.digest,
                sellerId: bot.user_id,
                sellerAddress: tx.sender,
                tag: bot.tag,
                subTag: bot.sub_tag,
                nftId: bot.nft_id,
                kiosk: String(event.kiosk),
                price: BigInt(String(event.price)),
                fee: 0,
                currency: Currency.SUI,
                confirmedAt: tx.confirmedAt
            };

            order = await createOrder(orderParams);

            await updateBotLastestActOnchain(bot.id, tx.confirmedAt)

            logger.info(`Order created successfully: ${order.id}`);
        }
    } catch (error) {
        logger.error('Error confirming item listed on market:', error);
        throw error;
    }
}
export const confirmItemDelistedMarket = async (
    events: SuiItemDelistedEventStruct[],
    tx: ParsedSuiTransaction,
    logger: any
) => {
    try {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            // Check if bot exists
            const bot = await findBotDelistableByNftId(String(event.id), tx.confirmedAt);
            if (!bot) {
                throw new Error(`Bot doesn't exist or has been updated`);
            }

            await cancelOrder(String(event.id), String(event.kiosk), tx.digest, tx.confirmedAt, tx.sender, bot.user_id);

            await updateBotLastestActOnchain(bot.id, tx.confirmedAt)

            logger.info(`Order cancelled successfully for NFT ID: ${event.id}`);
        }
    } catch (error) {
        logger.error('Error confirming item delisted from market:', error);
        throw error;
    }
};

export const confirmItemPurchasedMarket = async (
    events: SuiItemPurchasedEventStruct[],
    tx: ParsedSuiTransaction,
    logger: any
) => {
    try {
        for (let i = 0; i < events.length; i++) {

            const event = events[i];

            // console.log("================================");
            // console.log(event);
            
            

            // Check if bot exists
            const bot = await findBotDelistableByNftId(String(event.id), tx.confirmedAt);
            if (!bot) {
                throw new Error(`Bot doesn't exist or has been updated`);
            }

            const buyer = await findUserByAddress(tx.sender)
            if (!buyer) {
                throw new Error(`User not exist`);
            }

            await updateBotOwner({
                botId: bot.id,
                userId: buyer.id
            })

            await buyOrder(bot.nft_id, event.kiosk, tx.digest, tx.confirmedAt, tx.sender, buyer.id);

            await updateBotLastestActOnchain(bot.id, tx.confirmedAt)
            logger.info(`Bot purchased successfully for NFT ID: ${event.id}`);
        }

    } catch (error) {
        logger.error('Error confirming item purchased from market:', error);
        throw error;
    }
};