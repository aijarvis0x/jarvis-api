import type { QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { findUserByAddress } from "./users.service.js"
import { genAccessToken } from "../plugins/auth.js"
import { DISCORD_CALLBACK_URI, discordClient, DiscordMeResponse, DiscordToken, getXToken, GOOGLE_CALLBACK_URI, googleClient, GoogleMeResponse, GoogleToken, XMeResponse, XToken } from "../config/o2auth.js"
import HttpClient from "../lib/axios.js"

export type TelegramId = string | number
export type User = {
    id: string
    address?: string | null
}

export async function login(
    address: string
) {
    //check exist user
    let user = await findUserByAddress(address)
    let result: any
    if (!user) {
        //create acc
        let name = address.slice(0, 5) + "..." + address.slice(address.length - 5, address.length)
        result = await db.pool.query(
            `INSERT INTO users (address, name)
                VALUES ($1, $2) RETURNING *;`,
            [address, name]
        )

        result = result.rows[0] ?? null
    }

    //gen token
    let token = genAccessToken(address)
    if(!result) {
        result = await findUserByAddress(address)
    }
    return {
        token,
        user: result
    }

}

export async function discordCallback(code: string) {
    try {
        const token: DiscordToken = await discordClient.getToken({
            code,
            redirect_uri: DISCORD_CALLBACK_URI,
        });

        const discordServerClient = new HttpClient({
            baseURL: "https://discord.com",
            timeout: 100000,
            headers: {
                "Content-Type": "application/json",
                Authorization: `${token.token.token_type} ${token.token.access_token}`,
            },
        });

        const response = await discordServerClient.get(`/api/users/@me`);

        if (response.status == 200) {
            const data: DiscordMeResponse = response.data;
            return response.data;
        } else {
            throw new Error(`No response from discord server`);
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export async function googleCallback(code: string) {
    try {
        const token: GoogleToken = await googleClient.getToken({
            code,
            redirect_uri: GOOGLE_CALLBACK_URI,
        });

        const googleServerClient = new HttpClient({
            baseURL: "https://www.googleapis.com",
            timeout: 100000,
            headers: {
                "Content-Type": "application/json",
                Authorization: `${token.token.token_type} ${token.token.access_token}`,
            },
        });

        const response = await googleServerClient.get(`/oauth2/v3/userinfo`);
        
        if (response.status == 200) {
            const data: GoogleMeResponse = response.data;
            return response.data;
        } else {
            throw new Error(`No response from discord server`);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function XCallback(code: string) {
    try {
        const token: XToken = await getXToken(code);

        const XServerClient = new HttpClient({
            baseURL: "https://api.x.com/2",
            timeout: 100000,
            headers: {
                "Content-Type": "application/json",
                Authorization: `${token.token_type} ${token.access_token}`
            },
        })

        const response = await XServerClient.get(`/users/me`)

        if (response.status == 200) {
            const data: XMeResponse = response.data;
            return response.data;
        } else {
            throw new Error(`No response from discord server`);
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}



// export async function findUserByAddress(
//     address: string
// ): Promise<string | null> {
//     const statement: QueryConfig = {
//         name: "findUserByAddress",
//         text: "SELECT address FROM users WHERE address = $1 LIMIT 1",
//         values: [address],
//     }

//     return await db.pool.query(statement)
//         .then((result) => result.rows?.[0] ?? null)
// }
