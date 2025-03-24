import type { Pool, PoolClient, QueryConfig } from "pg"
import { db } from "../lib/pg.js"

export type TelegramId = string | number
export type User = {
  id: string
  address?: string | null
}

export async function createUser(
  address: string,
  client: PoolClient | Pool = db.pool
) {
  let name = address.slice(0, 5) + "..." + address.slice(address.length - 5, address.length)
  const result = await client.query(
    `INSERT INTO users (address, name)
        VALUES ($1, $2) RETURNING *;`,
    [address, name]
)

  return result.rows[0] ?? null
}

export async function findUserByAddress(
  address: string, pool: PoolClient | Pool = db.pool
) {
  const statement: QueryConfig = {
    name: "findUserByAddress",
  text: "SELECT id, name, avatar, description, address, telegram, discord, whatsapp, x, follower, following FROM users WHERE address = $1 OR name = $1 LIMIT 1",
    values: [address],
  }

  return await pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}

export const changeNameOfUser = async (userId: bigint, newName: string) => {

  const query = `
    UPDATE users
    SET name = $1,
        updated_at = NOW()
    WHERE id = $2 RETURNING name;
  `;

  const values = [newName, userId];

  try {
    return await db.pool.query(query, values);
  } catch (error) {
    throw error;
  }
};


export const updateUserAvatar = async (userId: bigint, avatarUrl: string): Promise<void> => {
  const query = `
    UPDATE users
    SET avatar = $1,
        updated_at = NOW()
    WHERE id = $2;
  `;

  const values = [avatarUrl, userId];

  try {
    await db.pool.query(query, values);
    console.log(`Avatar updated for user with id: ${userId}`);
  } catch (error) {
    console.error(`Failed to update avatar for user with id: ${userId}`, error);
    throw error;
  }
};


export async function findUserByName(
  name: string
) {
  const statement: QueryConfig = {
    name: "findUserByName",
    text: "SELECT id, name, avatar, description, address, telegram, discord, whatsapp, x, follower, following FROM users WHERE name = $1 LIMIT 1",
    values: [name],
  }

  return await db.pool.query(statement)
    .then((result) => result.rows?.[0] ?? null)
}
