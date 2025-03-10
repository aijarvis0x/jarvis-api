import { SERVER_5SON_AI_CORE } from "../env.js";
import HttpClient from "../lib/axios.js";
import { AdjectivesType, BotSettingMode, ModelProvider, PluginType, VoiceType } from "../services/bot.service.js";



export const client = new HttpClient({
    baseURL: SERVER_5SON_AI_CORE,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTH_JARVIS_TOKEN
    },
})

export type CreateAgentRequestBody = BotSettingMode & {
    id: string;
    name: string;
}

export const createAgent = async (agentData: CreateAgentRequestBody): Promise<boolean> => {
    try {
        const response = await client.post("/agents/new", agentData);

        console.log("Agent created successfully:", response.data);
        if(response.status == 200) {
            return true
        }
        return false
    } catch (error) {
        console.error("Failed to create agent:", error);
        throw error;
    }
};
