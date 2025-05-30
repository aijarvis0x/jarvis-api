import { EventLog } from "web3";
import { db } from "../lib/pg.js";
import { MintItemNftEvent, TxStatus } from "../utils/monad-utils.js";
import { multiConnectionTransaction } from "../lib/db/transaction.js";
import { createTransaction } from "./bot.service.js";
import dayjs from "dayjs";
import {
    createUser,
    findUserByAddress,
    getAccountSocial,
} from "./users.service.js";
import { PoolClient } from "pg";
import { getItem } from "../config/items.js";
import { Wallet, ethers } from "ethers";

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
        roundId: number;
        blockNumber: bigint;
    }
) {
    try {
        const item = getItem(params.roundId);
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
            JSON.stringify([params.roundId]),
            item.name,
            params.nftId,
            params.ownerId,
            params.owner,
            params.blockNumber,
            item.img,
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
                            owner: event.owner,
                            tokenId: Number(event.tokenId),
                            roundId: Number(event.roundId),
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

                    //create item
                    const itemId = await createItem(pgClient, {
                        nftId: String(event.tokenId),
                        owner: event.owner,
                        ownerId: BigInt(owner.id),
                        roundId: Number(event.roundId),
                        blockNumber: BigInt(eventLog.blockNumber ?? 0),
                    });
                    console.log("Item id = ", itemId);
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

interface PresignInput {
    userAddress: string;
    roundId: number;
    privateKey: string;
}

// Function to generate presigned signature for private minting round
async function test(input: PresignInput): Promise<string> {
    try {
        // Create a wallet instance from the private key
        const wallet = new Wallet(input.privateKey);

        // Create the same digest as in the contract
        // keccak256(abi.encode("mint", msg.sender, roundId))
        const abiCoder = new ethers.AbiCoder();
        const encodedData = abiCoder.encode(
            ["string", "address", "uint8"],
            ["mint", input.userAddress, input.roundId]
        );
        const message = ethers.keccak256(encodedData);

        // Convert to Ethereum signed message hash (matches ECDSA.toEthSignedMessageHash)
        const ethMessage = ethers.toUtf8Bytes(
            `\x19Ethereum Signed Message:\n32${message}`
        );
        const ethMessageHash = ethers.keccak256(ethMessage);

        // Sign the message
        const signature = await wallet.signMessage(
            ethers.getBytes(ethMessageHash)
        );

        return signature;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function generatePresignSignature(input: PresignInput) {
    try {
        const wallet = new ethers.Wallet(input.privateKey);

        const abiCoder = new ethers.AbiCoder();
        const digest = abiCoder.encode(
            ["string", "address", "uint8"],
            ["mint", input.userAddress, input.roundId]
        );
        // const signature = await wallet.signMessage(
        //     ethers.arrayify(ethers.keccak256(digest))
        // );

        const signature = await wallet.signMessage(ethers.getBytes(ethers.keccak256(digest)))

        return signature;
    } catch (error) {
        console.log(error);
        throw error;
    }

}

export const getItemSignature = async (userId, walletAddress, roundId) => {
    try {
        let query = `
            SELECT
                *
            FROM mint_fragment_history
            WHERE user_id = $1 AND round_id = $2
        `;
        let values = [userId, roundId];

        let result = await db.pool.query(query, values);

        let history = result.rows?.[0];

        if (history) {
            return history.signature;
        }

        const round1Wls: string[] = [
            "0x92FE67b51003d374C1698cBea996Fd3072186474"
        ]

        if(roundId != 1) return null

        if(!round1Wls.includes(walletAddress)) {
            return null
        }


        // const accountSocial = await getAccountSocial(userId);

        // if (
        //     !(
        //         accountSocial.is_connect_discord &&
        //         accountSocial.is_connect_google &&
        //         accountSocial.is_connect_x
        //     )
        // ) {
        //     return null;
        // }

        const privateKey = process.env.MINT_ITEM_PRIVATE_KEY as string;

        const signature = await generatePresignSignature({
            userAddress: walletAddress,
            roundId,
            privateKey,
        });

        let insertQuery = `
            INSERT INTO mint_fragment_history
            (
                user_id,
                round_id,
                signature
            )
            VALUES
            ($1, $2, $3)
            RETURNING id;
        `;

        values = [userId, roundId, signature];

        result = await db.pool.query(insertQuery, values);

        return signature;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
