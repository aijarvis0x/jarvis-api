import type { Pool, PoolClient, QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { BotState, OrderState } from "../constants.js"
import { AWS_REGION, AWS_SQS_CREATE_AI_AGENT, MINT_AI_FEE } from "../env.js"
import dayjs from "dayjs"
import { sendMessage } from "../lib/sqs.js"
import { MintNftEvent, TxStatus } from "../utils/monad-utils.js"
import { multiConnectionTransaction } from "../lib/db/transaction.js"
import { findUserByAddress } from "./users.service.js"
import { EventLog } from 'web3';
import { selectImageFromPool } from "../utils/s3-pool.js"
import { s3Config } from "../config/s3-config.js"
import { findOrderOfBots } from "./order.service.js"


export type BotInfo = {
  id: string,
  name?: string,
  avatar?: string,
  agent_id?: string,
  background?: string,
  setting_mode: BotSettingMode,
  nsfw?: boolean,
  tag?: string,
  sub_tag?: string,
  description?: string,
  state?: BotState,
  is_published?: boolean,
  is_prompt_published?: boolean,
  category_ids?: bigint[],
  website?: string,
  telegram?: string,
  discord?: string,
  x?: string
}

export type BotSettingMode = {
  clients: String[],
  modelProvider: ModelProvider,
  settings: {
    secrets: Record<string, any>;
    voice: {
      model: VoiceType;
    };
  }
  plugins: PluginType[],
  adjectives: AdjectivesType[],
  bio: String[],
  lore: String[],
  knowledge: String[],
  messageExamples: Array<
    Array<{
      user: string;
      content: {
        text: string;
      };
    }>
  >;
  postExamples: string[];
  topics: string[];
  style: {
    all: string[];
    chat: string[];
    post: string[];
  };
}


export enum ModelProvider {
  openai = 'openai'
}

export enum VoiceType {
  en_US_male_medium = 'en_US-male-medium'
}

export enum PluginType {
  elizaos_plugin_suimarket = '@elizaos/plugin-suimarket'
}

export enum AdjectivesType {
  ANALYTICAL = "analytical",
  PRECISE = "precise",
  DATA_DRIVEN = "data-driven",
  METHODICAL = "methodical",
  CAUTIOUS = "cautious",
  STRATEGIC = "strategic",
  OBJECTIVE = "objective",
  INSIGHTFUL = "insightful",
  PROFESSIONAL = "professional",
  VIGILANT = "vigilant",
  RATIONAL = "rational",
  THOROUGH = "thorough"
}

export type BotId = bigint | number | string

interface UpdateBotData {
  name?: string;
  nsfw?: boolean;
  tag?: string;
  sub_tag?: string;
  description?: string;
  setting_mode?: Record<string, any>;
}

const SETTING_MODE_DEFAUT = JSON.stringify({
  "clients": ["direct"],
  "modelProvider": ModelProvider.openai,
  "plugins": [PluginType.elizaos_plugin_suimarket],
  "settings": {
    "secrets": {},
    "voice": {
      "model": "en_US-male-medium"
    }
  },
  "adjectives": [
    "analytical",
    "precise",
    "data-driven",
    "methodical",
    "cautious",
    "strategic",
    "objective",
    "insightful",
    "professional",
    "vigilant",
    "rational",
    "thorough"
  ],
  "bio": [
    "Expert cryptocurrency market analyst and portfolio strategist",
    "Specialized in real-time market analysis and trend identification",
    "Data-driven trader with deep understanding of market dynamics"
  ],
  "lore": [
    "Successfully predicted multiple major market movements",
    "Developed innovative portfolio balancing strategies",
    "Pioneer in combining on-chain metrics with traditional market analysis"
  ],
  "knowledge": [
    "Deep understanding of cryptocurrency market mechanics",
    "Expert in technical analysis and chart patterns",
    "Proficient in DeFi protocols and yield strategies",
    "Specialist in market sentiment analysis",
    "Master of risk management and portfolio optimization"
  ],
  "messageExamples": [
    [
      {
        "user": "{{user1}}",
        "content": { "text": "What are today's top gainers?" }
      },
      {
        "user": "CryptoSage",
        "content": {
          "text": "Here are today's top performers:\n1. TOKEN-A: +25% (Volume: $1.2M)\n2. TOKEN-B: +18% (Volume: $800K)\n3. TOKEN-C: +15% (Volume: $500K)\nNotable catalyst for TOKEN-A is the new partnership announcement."
        }
      }
    ],
    [
      {
        "user": "{{user1}}",
        "content": { "text": "How should I optimize my portfolio?" }
      },
      {
        "user": "CryptoSage",
        "content": {
          "text": "Based on current market conditions, consider: 40% blue-chip (BTC/ETH), 30% mid-cap altcoins, 20% DeFi protocols, and 10% cash reserve for dips. Always maintain stop-losses and don't over-leverage."
        }
      }
    ]
  ],
  "postExamples": [
    "Market structure suggests accumulation phase - smart money moving quietly",
    "Risk-off signals flashing: Funding rates negative, volume declining, time to be cautious",
    "DeFi TVL hitting new highs while prices consolidate - bullish divergence forming"
  ],
  "topics": [
    "cryptocurrency markets",
    "trading strategies",
    "portfolio management",
    "market analysis",
    "risk management",
    "technical analysis",
    "DeFi trends",
    "market sentiment"
  ],
  "style": {
    "all": [
      "maintain technical accuracy",
      "be approachable and clear",
      "use concise and professional language"
    ],
    "chat": [
      "ask clarifying questions when needed",
      "provide examples to explain complex concepts",
      "maintain a friendly and helpful tone"
    ],
    "post": [
      "share insights concisely",
      "focus on practical applications",
      "use engaging and professional language"
    ]
  }
})
export const findBotById = async (botId: BotId, userId: bigint) => {
  const statement: QueryConfig = {
    name: "findBotById",
    text: "SELECT * FROM bots WHERE id = $1 AND user_id = $2 LIMIT 1",
    values: [BigInt(botId), userId],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

export const findBotByIdNonOwner = async (botId: BotId) => {
  const statement: QueryConfig = {
    name: "findBotByIdNonOwner",
    text: "SELECT * FROM bots WHERE id = $1 LIMIT 1",
    values: [BigInt(botId)],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}


export const findBotByIdWithoutOwner = async (botId: BotId) => {
  const statement: QueryConfig = {
    name: "findBotByIdWithoutOwner",
    text: "SELECT * FROM bots WHERE id = $1 LIMIT 1",
    values: [BigInt(botId)],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

export const findBotByNftId = async (botObjId: string, confirmedAt: bigint) => {
  const statement: QueryConfig = {
    name: "findBotByNftId",
    text: "SELECT * FROM bots WHERE nft_id = $1 AND lastest_act < $2 LIMIT 1",
    values: [botObjId, confirmedAt],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

export const findBotByOnlyNftId = async (botObjId: string) => {
  const statement: QueryConfig = {
    name: "findBotByOnlyNftId",
    text: "SELECT * FROM bots WHERE nft_id = $1 LIMIT 1",
    values: [botObjId],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

export const findBotDelistableByNftId = async (botObjId: string, confirmedAt: bigint) => {
  const statement: QueryConfig = {
    name: "findBotDelistableByNftId",
    text: "SELECT * FROM bots WHERE nft_id = $1 AND lastest_act < $2 LIMIT 1",
    values: [botObjId, confirmedAt],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}


export const getListBots = async (userId: bigint, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const statement: QueryConfig = {
    name: "getListBots",
    text: `
      SELECT
        avatar,
        id,
        name,
        background,
        description,
        nft_id,
        attributes,
        category_ids,
        state,
        is_published
      FROM bots
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3;
    `,
    values: [userId, limit, offset],
  };


  let bots = await db.pool.query(statement)
    .then((result) => result.rows ?? []);
  let botIds = bots.map(ele => BigInt(ele.id))

  let orders = await findOrderOfBots(botIds)
  let OrdersMap = {}
  orders.map(ele => {
    if (ele.state == OrderState.Listed) {
      OrdersMap[ele?.bot_id] = {
        orderId: ele?.order_id,
        price: ele?.price,
        state: OrderState.Listed
      }
    }
  })


  return bots.map(ele => {
    return {
      ...ele,
      order: OrdersMap[ele?.id]
    }
  })
};


export const updateBotAvatar = async (botId: BotId, avatarUrl: string): Promise<void> => {
  const query = `
    UPDATE bots
    SET avatar = $1,
        updated_at = NOW()
    WHERE id = $2 AND state = 'draft';
  `;

  const values = [avatarUrl, botId];

  try {
    await db.pool.query(query, values);
    console.log(`Avatar updated for bot with id: ${botId}`);
  } catch (error) {
    console.error(`Failed to update avatar for bot with id: ${botId}`, error);
    throw error;
  }
};

export const publishBot = async (botId: BotId): Promise<void> => {
  const query = `
    UPDATE bots
    SET is_published = true,
        updated_at = NOW()
    WHERE id = $1 AND state = 'created';
  `;

  const values = [BigInt(botId)];

  try {
    await db.pool.query(query, values);
  } catch (error) {
    console.error(`Failed to publish AI-agent with id: ${botId}`, error);
    throw error;
  }
};

export const updateStateBot = async (props: {
  botId: BotId,
  state: BotState,
  txHash: string,
  nftId: string
}) => {
  const query = `
    UPDATE bots
    SET state = $1, tx_hash = $2, nft_id = $3, updated_at = NOW()
    WHERE id = $4 AND state = 'pending' RETURNING *;
  `;

  const values = [props.state, props.txHash, props.nftId, BigInt(props.botId)];

  try {
    return await db.pool.query(query, values).then((result) => result.rows[0] ?? null)
  } catch (error) {
    throw error;
  }
};

export const updateOnlyStateBot = async (props: {
  botId: BotId,
  state: BotState,
  oldState: BotState,
}): Promise<void> => {
  const query = `
    UPDATE bots
    SET state = $1,
        updated_at = NOW()
    WHERE id = $2 AND state = $3 RETURNING *;
  `;

  const values = [props.state, BigInt(props.botId), props.oldState];

  try {
    await db.pool.query(query, values);
  } catch (error) {
    throw error;
  }
};

export const updateBotOwner = async (props: {
  botId: string,
  userId: string,
  newOwner: string
}): Promise<void> => {
  const query = `
    UPDATE bots
    SET user_id = $1, owner = $2,
        updated_at = NOW()
    WHERE id = $3 RETURNING *;
  `;

  const values = [props.userId, props.newOwner, props.botId];

  try {
    await db.pool.query(query, values);
  } catch (error) {
    throw error;
  }
};


export const updateBotLastestActOnchain = async (botId: bigint, lastActOn: bigint, pool: PoolClient | Pool = db.pool) => {
  const query = `
    UPDATE bots
    SET lastest_act = $1,
        updated_at = NOW()
    WHERE id = $2;
  `;

  const values = [lastActOn, botId];

  try {
    await pool.query(query, values);
  } catch (error) {
    throw error;
  }
}


export const updateBotById = async (id: BotId, updateData: UpdateBotData): Promise<BotInfo> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${index}`);
      values.push(key === "setting_mode" || key === "category_ids" ? JSON.stringify(value) : value);
      index++;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const query = `
      UPDATE bots
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING *;
    `;


    const result = await db.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Bot not found or no changes made");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating bot:", error);
    throw error;
  }
};


export const updateBotBackground = async (botId: BotId, backgroundUrl: string): Promise<void> => {
  const query = `
    UPDATE bots
    SET background = $1,
        updated_at = NOW()
    WHERE id = $2;
  `;

  const values = [backgroundUrl, botId];

  try {
    await db.pool.query(query, values);
    console.log(`Background updated for bot with id: ${botId}`);
  } catch (error) {
    console.error(`Failed to update background for bot with id: ${botId}`, error);
    throw error;
  }
};



export const confirmedMintBot = async (
  txHash: string,
  event: MintNftEvent,
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
            contractAddress: process.env.NFT_CONTRACT_ADDRESS,
            blockNumber: Number(eventLog.blockNumber),
            value: 0,
            events: {
              owner: eventLog.returnValues.owner,
              tokenId: Number(eventLog?.returnValues?.tokenId),
              agentType: Number(eventLog.returnValues.agentType),
              packageId: Number(eventLog.returnValues.packageId)
            },
            logs: null,
            confirmedAt: dayjs.utc().toDate(),
          })


          if (!log) {
            throw new Error("transaction existed. Tx: " + String(eventLog?.transactionHash))
          }

          const owner = await findUserByAddress(event.owner, pgClient)

          if (!owner) throw new Error("Owner does't exist")

          //create bot
          const botId = await createBot(pgClient, { nftId: String(event.tokenId), owner: event.owner, ownerId: BigInt(owner.id), agentType: Number(event.agentType), packageId: Number(event.packageId), blockNumber: BigInt(eventLog.blockNumber ?? 0) })
          console.log('botId = ', botId)

          //add to SQS -> gen agent AI
          await sendMessage(AWS_SQS_CREATE_AI_AGENT, JSON.stringify({ xid: Number(botId) }))

        } catch (error) {
          bail(new Error("Error during bot processing transaction:" + error));
          throw error;
        }
      }
    );

  } catch (error) {
    throw error
  }
}


export const createTransaction = async (pool: PoolClient, params: {
  txHash,
  status,
  sender,
  recipient,
  nonce,
  contractAddress,
  blockNumber,
  logIndex,
  value,
  events,
  logs,
  confirmedAt,
}) => {
  try {
    const insertQuery = `
      INSERT INTO transactions
        (tx_hash, status, sender, recipient, nonce, log_index, contract_address, block_number, value, events, logs, confirmed_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;



    await pool.query(insertQuery, [
      params.txHash,
      params.status,
      params.sender,
      params.recipient,
      params.nonce,
      params.logIndex,
      params.contractAddress,
      params.blockNumber,
      params.value,
      params.events,
      params.logs,
      params.confirmedAt,
    ]);

    return true

  } catch (error) {
    console.log(error)
    return false
  }
}

export const createBot = async (pool: PoolClient, params: { nftId: string, ownerId: bigint, owner: string, agentType: number, packageId: number, blockNumber: bigint }): Promise<bigint> => {

  try {
    const checkQuery = 'SELECT id FROM bots WHERE nft_id = $1';
    const checkResult = await pool.query(checkQuery, [params.nftId]);
    if (!!checkResult?.rowCount && checkResult?.rowCount > 0) {
      throw new Error(`Bot with nftId ${params.nftId} already exists.`);
    }

    //@todo random nft
    const { url: avatarUrl, pool: type } = await selectImageFromPool(s3Config, params.agentType, params.packageId)
    console.log(`avatarUrl`, avatarUrl)
    // const avatarUrl = `https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/avatars/${params.nftId}.jpeg`;
    // const avatarUrl = `https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/avatars/example.jpeg`;

    const covertType = (typeInput) => {
      let _type = ''

      switch (typeInput) {
        case "pool1Cryptoman":
        case "pool2Cryptoman":
          _type = "Comon"
          break;
        case "pool1Nurse":
        case "pool3Nurse":
          _type = "Rare"
          break;
        case "pool1Anime":
        case "pool2Nurse":
          _type = "Epic"
          break;
        case "pool2Anime":
          _type = "Legendary"
          break;
        case "pool3Cryptoman":
        case "pool3Anime":
          _type = "Mythic"
          break;
        default:
          _type = "Mythic"
          break;
      }

      return _type
    }
    const animeDescription = "The degen crypto girl – smart, sexy, and always one step ahead. She trades with confidence, flips NFTs like a pro, and laughs in the face of liquidations. Sharp, fearless, and a little dangerous—she’s not just here to play, she’s here to win. Think you can handle her?"
    const descriptionMapping = {
      0: "The Ultimate Degen Trader – Risk It All, Win It All. 🚀🔥 A high-stakes degen who thrives on futures, stacks rare NFTs, and holds memes like gold. Sharp in the market, smooth in real life—serious when it counts, but always a romantic at heart.",
      1: "Your crypto nurse – soft hands, sharp mind. She knows your highs, your lows, and every chart-induced heartbreak in between. A soothing voice when the market bleeds, a playful tease when the gains roll in—she always gives you exactly what you need. Sweet, fiery, and just a little too tempting. Using Allora Network for everyday trading.",
      2: animeDescription,
    }

    const names = {
      0: "MonCryptoMan",
      1: "MonNurse",
      2: "MonAnime",
    }
    const getValue = (obj: any, key: number, defaultValue: any) => obj?.[key] ?? defaultValue;
    const description = getValue(descriptionMapping, params.agentType, animeDescription)
    const name = getValue(names, params.agentType, "MonCryptoMan") + ` #${params.nftId}`

    const attributes = JSON.stringify([
      { rare: covertType(type) }
    ])

    // const backgrounds = [
    //   "https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/backgrounds/Knight_2.png",
    //   "https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/backgrounds/Knight.png",
    //   "https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/backgrounds/King.png"
    // ]

    // const background = backgrounds[Math.round(Math.random() * 6) %3]

    const backgroundMapping = {
      0: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/backgrounds/cryptoman.png",
      1: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/backgrounds/nurse.png",
      2: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/uploads/backgrounds/anime.png"
    }

    const background = backgroundMapping[params.agentType]


    const insertQuery = `
          INSERT INTO bots
            (category_ids, name, background, nft_id, user_id, owner, avatar, description, attributes, state, created_at, updated_at, lastest_act)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
          RETURNING id;
        `;


    const values = [
      JSON.stringify([params.agentType]),
      name,
      background,
      params.nftId,
      params.ownerId,
      params.owner,
      avatarUrl,
      description,
      attributes,
      BotState.WaitingGenerate,
      params.blockNumber
    ];

    console.log(values)

    const result = await pool.query(insertQuery, values);
    const newBotId = result.rows[0].id;


    return BigInt(newBotId);

  } catch (error) {
    console.log(`craete bot error `, error)
    throw error
  }
}