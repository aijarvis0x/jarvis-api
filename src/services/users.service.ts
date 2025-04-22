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

export async function getListFriend(userId) {
  try {
    let query = `
    SELECT
      f.*,
      row_to_json(u) as user    
    FROM (
      SELECT
        *,
        json_array_elements_text(friend_ids::json) AS friend_id
      FROM friends
      WHERE user_id = $1
    ) f
    INNER JOIN users u ON f.friend_id::BIGINT = u.id
    `
    let values = [
        userId,
    ]

    let result = await db.pool.query(query, values);

    return result.rows;
  } catch (error) {
    console.log(error);
    throw error;
    
  }
}

export async function getAccountSocial(userId) {
  try {
    let query = `
    SELECT
      CASE
        WHEN da.account_id IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS is_connect_discord,    
      CASE
        WHEN ga.account_id IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS is_connect_google,    
      CASE
        WHEN xa.account_id IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS is_connect_x,
      row_to_json(da) AS discord_account,
      row_to_json(ga) AS google_account,
      row_to_json(xa) AS x_account
    FROM users u
    LEFT JOIN discord_account da ON u.id = da.user_id
    LEFT JOIN google_account ga ON u.id = ga.user_id
    LEFT JOIN x_account xa ON u.id = xa.user_id
    WHERE u.id = $1
    `
    let values = [
        userId,
    ]

    let result = await db.pool.query(query, values);

    return result.rows?.[0];
  } catch (error) {
    console.log(error);
    throw error;
    
  }
}

export async function createRefCode(userId) {
  try {
    let query = `
      INSERT INTO user_ref_code (
        user_id,
        ref_code
      ) VALUES (
        $1,
        $2
      )
      RETURNING ref_code;
    `
    let values = [
      userId,
      userId
    ]

    let result = await db.pool.query(query, values);

    return result.rows?.[0];
  } catch (error) {
    console.log(error);
    throw error
  }
}

export async function getRefCode(userId) {
  try {
    let query = `
      SELECT
        ref_code
      FROM user_ref_code
      WHERE user_id = $1
      LIMIT 1
    `
    let values = [
      userId
    ]

    let result = await db.pool.query(query, values);

    return result.rows?.[0]?.ref_code;
  } catch (error) {
    console.log(error);
    throw error
  }
}
