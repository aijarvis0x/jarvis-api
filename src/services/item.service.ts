import { db } from "../lib/pg.js";

export async function getMyItems(userId: bigint) {
		try {

        let query = `
            SELECT
                *
            FROM items
            WHERE user_id = $1
        `
        let values = [
            userId
        ]

        let result = await db.pool.query(query, values);

        return result.rows;

		} catch (error) {
            console.log(error);
            throw error;
		}
}