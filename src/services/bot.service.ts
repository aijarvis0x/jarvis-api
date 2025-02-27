import type { QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { BotState } from "../constants.js"
import { ParsedSuiTransaction, signGenerateBotMsg, SuiMintNftAiAgentEventStruct } from "../utils/sui-utils.js"
import { AWS_REGION, AWS_SQS_CREATE_AI_AGENT, MINT_AI_FEE } from "../env.js"
import dayjs from "dayjs"
import { sendMessage } from "../lib/sqs.js"

const MINT_AI_REQ_EXP = 86400000

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

const insertBotDraft = async (userId: bigint, owner: string): Promise<BotInfo> => {
  const defaultBotInfo = {
    owner,
    name: null,
    avatar: null,
    background: null,
    setting_mode: JSON.stringify({
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
    }),
    nsfw: false,
    tag: null,
    sub_tag: null,
    description: null,
    state: BotState.Draft,
    is_published: false,
    is_prompt_published: false,
    category_ids: [],
    website: null,
    telegram: null,
    discord: null,
    x: null,
  };

  const query = `
    INSERT INTO bots (
      user_id, name, avatar, background, setting_mode, nsfw, tag, sub_tag, description,
      state, is_published, is_prompt_published, category_ids, website, telegram, discord, x, created_at, updated_at, owner
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW(), $18
    ) RETURNING *;
  `;

  const values = [
    userId,
    defaultBotInfo.name,
    defaultBotInfo.avatar,
    defaultBotInfo.background,
    defaultBotInfo.setting_mode,
    defaultBotInfo.nsfw,
    defaultBotInfo.tag,
    defaultBotInfo.sub_tag,
    defaultBotInfo.description,
    defaultBotInfo.state,
    defaultBotInfo.is_published,
    defaultBotInfo.is_prompt_published,
    defaultBotInfo.category_ids,
    defaultBotInfo.website,
    defaultBotInfo.telegram,
    defaultBotInfo.discord,
    defaultBotInfo.x,
    defaultBotInfo.owner
  ];

  const result = await db.pool.query(query, values);

  const bot = result.rows?.[0] ?? null;

  return {
    id: bot.id,
    name: bot.name || undefined,
    avatar: bot.avatar || undefined,
    background: bot.background || undefined,
    setting_mode: bot.setting_mode ? JSON.parse(JSON.stringify(bot.setting_mode)) : undefined,
    nsfw: bot.nsfw || undefined,
    tag: bot.tag || undefined,
    sub_tag: bot.sub_tag || undefined,
    description: bot.description || undefined,
    state: bot.state || undefined,
    is_published: bot.is_published || undefined,
    is_prompt_published: bot.is_prompt_published || undefined,
    category_ids: bot.category_ids || [],
    website: bot.website || undefined,
    telegram: bot.telegram || undefined,
    discord: bot.discord || undefined,
    x: bot.x || undefined,
  };
};

const findBotDraft = async (userId: bigint): Promise<BotInfo> => {
  const statement: QueryConfig = {
    name: "findBotDraft",
    text: "SELECT * FROM bots WHERE user_id = $1 AND state = 'draft' LIMIT 1",
    values: [userId],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

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

export const findBotByNftId = async (botObjId: string, confirmedAt: Date | null) => {
  const statement: QueryConfig = {
    name: "findBotByNftId",
    text: "SELECT * FROM bots WHERE nft_id = $1 AND lastest_act < $2 LIMIT 1",
    values: [botObjId, dayjs.utc(confirmedAt).toDate()],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

export const findBotDelistableByNftId = async (botObjId: string, confirmedAt: Date | null) => {
  const statement: QueryConfig = {
    name: "findBotDelistableByNftId",
    text: "SELECT * FROM bots WHERE nft_id = $1 AND lastest_act <= $2 LIMIT 1",
    values: [botObjId, dayjs.utc(confirmedAt).toDate()],
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
        state,
        is_published
      FROM bots
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3;
    `,
    values: [userId, limit, offset],
  };

  return await db.pool.query(statement)
    .then((result) => result.rows ?? []);
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
  userId: string
}): Promise<void> => {
  const query = `
    UPDATE bots
    SET user_id = $1,
        updated_at = NOW()
    WHERE id = $2 RETURNING *;
  `;

  const values = [props.userId, props.botId];

  try {
    await db.pool.query(query, values);
  } catch (error) {
    throw error;
  }
};


export const updateBotLastestActOnchain = async (botId: bigint, lastActOn: Date | null) => {
  const query = `
    UPDATE bots
    SET lastest_act = $1,
        updated_at = NOW()
    WHERE id = $2;
  `;

  const values = [lastActOn, botId];

  try {
    await db.pool.query(query, values);
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


export const updateBotSign = async (botId: BotId, msg: string, signature: string, nonce: bigint, expired_time: Date, fee): Promise<void> => {
  const query = `
    UPDATE bots
    SET msg = $1,
        signature = $2,
        nonce = $3,
        expired_time = $4,
        fee = $5,
        updated_at = NOW()
    WHERE id = $6 AND state = 'pending';
  `;

  const values = [msg, signature, nonce, expired_time, fee, botId];

  try {
    await db.pool.query(query, values);
  } catch (error) {
    throw error;
  }
};


// draft -> pending -> confirmed -> waiting_generate -> created
export const createBotDraft = async (userId: bigint, owner: string): Promise<BotInfo> => {
  try {

    //check exist draft
    let botDraft = await findBotDraft(userId)

    if (!botDraft) {
      //create bot draft
      botDraft = await insertBotDraft(userId, owner)
    }

    return botDraft

  } catch (error) {
    throw error
  }
}

export const genSignMintBot = async (props: {
  id: bigint,
  receiver: string,
  name: any,
  xid: any,
  description,
}) => {
  try {
    let { msg, signature, nonce, expired_time, fee } = await signGenerateBotMsg({
      id: props.id,
      receiver: props.receiver,
      xid: props.xid,
      name: props.name,
      description: props.description,
      mint_fee: MINT_AI_FEE,
      expire_timestamp: dayjs.utc(dayjs.utc().valueOf() + MINT_AI_REQ_EXP).valueOf(),
    })

    //update db
    await updateBotSign(props.xid, msg, signature, nonce, expired_time, fee)

    return {
      msg, signature, nonce, expired_time, fee
    }

  } catch (error) {
    throw error
  }
}

//state -> confirmed
export const confirmedMintBot = async (
  events: SuiMintNftAiAgentEventStruct[],
  tx: ParsedSuiTransaction,
  logger: any
) => {
  try {

    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      try {
        console.log(event)
        let bot = await updateStateBot({
          botId: String(event.xid),
          state: BotState.Confirmed,
          txHash: tx.digest,
          nftId: String(event.id)
        })

        //add to SQS
        await sendMessage(AWS_SQS_CREATE_AI_AGENT, JSON.stringify({xid: bot.id}))
        await updateOnlyStateBot({
          botId: String(event.xid),
          state: BotState.WaitingGenerate,
          oldState: BotState.Confirmed
        })
      } catch (error) {
        logger.error(`confirmedMintBot -> updateStateBot() error or existed ` + String(event.xid) + tx.digest + " " + error)
      }
    }

  } catch (error) {
    throw error
  }
}