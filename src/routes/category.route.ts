import { db } from "../lib/pg.js";
import { insertCategories } from "../scripts/init-category.js";


import type { AppInstance } from "../types.js"


export default async (app: AppInstance) => {

    app.get("/list", {
        schema: {
            tags: ["Category"],
        },
        handler: async (request, reply) => {
            try {

                // //insert list category
                // await insertCategories()

                const result = await db.pool.query("SELECT * FROM categories ORDER BY priority DESC, created_at ASC");

                return reply.status(200).send({
                    message: "OK",
                    data: {
                        categories: result.rows,
                    }
                })
            } catch (error) {
                console.error(error);
                reply.status(500).send({ error: "Internal Server Error" });
            }
        },
    });

    app.post("/init", {
        schema: {
            tags: ["Category"],
        },
        handler: async (request, reply) => {
            try {

                //insert list category
                await insertCategories()

                const result = await db.pool.query("SELECT * FROM categories ORDER BY priority DESC, created_at ASC");

                return reply.status(200).send({
                    message: "OK",
                    data: {
                        categories: result.rows,
                    }
                })
            } catch (error) {
                console.error(error);
                reply.status(500).send({ error: "Internal Server Error" });
            }
        },
    });

}