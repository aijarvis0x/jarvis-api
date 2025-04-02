import { BotSettingMode } from "../config/create-bot.js";
import { SERVER_5SON_AI_CORE } from "../env.js";
import HttpClient from "../lib/axios.js";



export const client = new HttpClient({
    baseURL: SERVER_5SON_AI_CORE,
    timeout: 100000,
    headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTH_JARVIS_TOKEN
    },
})

export type CreateAgentRequestBody = BotSettingMode & {
    name: string;
    parentId: string;
}

export const createAgent = async (agentData: CreateAgentRequestBody): Promise<boolean> => {
    try {
        const response = await client.post("/agents/new", agentData);

        console.log("Agent created successfully:", response.data);
        if(response.status == 200) {
            let data = response.data;
            return data
        } else {
            throw new Error(`Error at agent server ${response.data}, status: ${response.status}`)
        }
    } catch (error) {
        console.error("Failed to create agent:", error);
        throw error;
    }
};
