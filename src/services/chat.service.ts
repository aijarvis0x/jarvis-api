import { db } from "../lib/pg.js";
import { v4 as uuidv4 } from "uuid";
import { client } from "../core-ai/api.lib.js";
import { QueryConfig } from "pg";
import { findBotById, findBotByIdNonOwner } from "./bot.service.js";
import { BotState } from "../constants.js";

export const getConversationByUserIdAndBotId = async (userId: bigint, botId: bigint) => {
  try {
    const statement: QueryConfig = {
      name: "findConversation",
      text: "SELECT * FROM conversations WHERE user_id = $1 AND bot_id = $2 LIMIT 1",
      values: [userId, botId],
    };

    return await db.pool
      .query(statement)
      .then((result) => result.rows?.[0] ?? null);
  } catch (error) {
    throw error;
  }
};

export const createConversation = async (
  userId: bigint,
  botId: bigint,
) => {
  try {
    const bot = await findBotByIdNonOwner(botId)
    if (!bot) {
      throw new Error("Bot not found")
    }
    // TODO: remove it when demo done
    else if (bot.state !== BotState.Created) {
      throw new Error("Bot is not created")
    }

    const query = `
			INSERT INTO conversations (
				bot_id,
				agent_id,
				user_id,
				conversation_id,
				created_at,
				updated_at

			) VALUES (
				$1,
				$2,
				$3,
				$4,
				NOW(),
				NOW()
			) RETURNING *;
		`;

    const values = [botId, bot.agent_id, userId, uuidv4()];
    const result = await db.pool.query(query, values);

    const conversation = result.rows?.[0] ?? null;
    return conversation;
  } catch (error) {
    throw error;
  }
};

export const sendMessage = async (
  userId: bigint,
  conversationId: string,
  text: string,
  agentId: string
) => {
  try {
    // const response = await client.post(`${agentId}/message`, {
    //   text: text,
    //   userId: userId,
    //   roomId: conversationId,
    // });
    const response = await client.post(`e61b079d-5226-06e9-9763-a33094aa8d82/message`, {
      text: text,
      userId: userId,
      roomId: conversationId,
    });

    if (response.status == 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Failed to create agent:", error);
    throw error;
  }
};
