import type { QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import { findUserByAddress } from "./users.service.js"
import { genAccessToken } from "../plugins/auth.js"

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
