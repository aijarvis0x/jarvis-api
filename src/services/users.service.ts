import type { QueryConfig } from "pg"
import { db } from "../lib/pg.js"

export type TelegramId = string | number
export type User = {
  id: string
  address?: string | null
}

export async function loggingUser(
  address: string
) {
  const result = await db.pool.query(
    `INSERT INTO users (id)
     VALUES ($1) ON CONFLICT (id)
   DO
    UPDATE SET raw = EXCLUDED.raw RETURNING id`,
    [address]
  )

  return result.rows[0] ?? null
}

export async function findUserByAddress(
  address: string
) {
  const statement: QueryConfig = {
    name: "findUserByAddress",
  text: "SELECT id, name, avatar, description, address, telegram, discord, whatsapp, x, follower, following FROM users WHERE address = $1 LIMIT 1",
    values: [address],
  }

  return await db.pool.query(statement)
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
