import { AWS_SQS_CREATE_AI_AGENT } from "../env.js";
import { multiConnectionTransaction } from "../lib/db/transaction.js";
import { deleteMessage, receiveMessages, SQSConfig } from "../lib/sqs.js";
import { db } from "../lib/pg.js"
import { Pool } from "pg";
import { createAgent, CreateAgentRequestBody } from "./api.lib.js";
import { BotInfo } from "../services/bot.service.js";
import { integer } from "aws-sdk/clients/cloudfront.js";
import { Integer } from "aws-sdk/clients/apigateway.js";
import { agentTypeConfig } from "../config/agent.js";



export const processBotWithTransaction = async (
  pools: Pool[],
  botId: string,
  updateCallback: (bot: any) => Promise<any>
): Promise<void> => {
  await multiConnectionTransaction(
    pools,
    async (bail, clients, mongoSession) => {
      try {
        const [pgClient] = clients;

        const selectQuery = `
          SELECT *
          FROM bots
          WHERE id = $1 AND state = 'waiting_generate'
          FOR UPDATE;
        `;
        const result = await pgClient.query(selectQuery, [botId]);

        if (result.rows.length === 0) {
          throw new Error(`Bot with botId ${botId} not found or not in 'waiting_generate' state.`);
        }

        const bot = result.rows[0];
        console.log(`Bot found and locked:`, bot);

        const createAgent = await updateCallback(bot);
        // if (!createAgent) {
        //   throw new Error("Error during call api create agent")
        // }
        const updateQuery = `
          UPDATE bots
          SET state = 'created', updated_at = NOW(), agent_id = $2
          WHERE id = $1;
        `;
        await pgClient.query(updateQuery, [botId, createAgent.id]);

        console.log(`Bot with botId ${botId} updated to 'created'.`);
      } catch (error) {
        console.error("Error during bot processing transaction:", error);
        bail(new Error("Error during bot processing transaction:" + error));
        throw error;
      }
    }
  );
};


const callApiGenBot = async (bot: BotInfo) => {
  try {
    console.log(`Start call api create bot with info: \n\tname = ${bot.name}\n\tcategories = ${bot.category_ids}`);
    

    let botCategory = Number(bot.category_ids?.[0])
    // if (!botCategory) {
    //   botCategory = 0
    // }

    let parentId = agentTypeConfig[botCategory].parentAgentId

    let dataExp: CreateAgentRequestBody = {
      "name": String(bot.name),
      "parentId": parentId,
      ...bot.setting_mode
    }

    return await createAgent(dataExp)
  } catch (error) {
    throw error
  }
};


export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const startProcessing = async (config: SQSConfig): Promise<void> => {
  console.log("Starting SQS processing...");

  while (true) {
    try {
      const messages = await receiveMessages(config);

      console.log(messages.length)
      if (messages.length === 0) {
        // console.log("No messages to process.");
        await sleep(3000)
        continue;
      }

      console.log(`[${new Date()}]Received ${messages.length} message(s).`);

      for (const message of messages) {
        await processBotWithTransaction([db.pool], String(JSON.parse(message.Body)?.xid), callApiGenBot);
        await deleteMessage(config.queueUrl, message.ReceiptHandle);
      }
    } catch (error) {
      console.error("Error during processing:", error);
      await sleep(3000)
    }
  }
};

startProcessing({
  queueUrl: String(AWS_SQS_CREATE_AI_AGENT),
})
