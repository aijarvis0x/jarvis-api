import { db } from "../lib/pg.js";


const categories = [
    { id: 1, value: "ai-detector", label: "Mon Doctor", icon: "/icon/id-con.svg" },
    { id: 2, value: "blog-writer", label: "Mon Girl", icon: "/icon/id-con.svg" },
    { id: 3, value: "ideas", label: "Mon Signal", icon: "/icon/id-con.svg" },
    // { id: 4, value: "speech-to-text", label: "Speech to Text", icon: "/icon/id-con.svg" },
    // { id: 5, value: "web3", label: "Web3", icon: "/icon/id-con.svg" },
    // { id: 6, value: "ai-model", label: "AI Model", icon: "/icon/id-con.svg" },
    // { id: 7, value: "automation", label: "Automation", icon: "/icon/id-con.svg" },
    // { id: 8, value: "chatbot", label: "Chatbot", icon: "/icon/id-con.svg" },
    // { id: 9, value: "code-generator", label: "Code Generator", icon: "/icon/id-con.svg" },
    // { id: 10, value: "design", label: "Design", icon: "/icon/id-con.svg" },
    // { id: 11, value: "image", label: "Image", icon: "/icon/id-con.svg" },
    // { id: 12, value: "meeting", label: "Meeting", icon: "/icon/id-con.svg" },
    // { id: 13, value: "presentation", label: "Presentation", icon: "/icon/id-con.svg" },
    // { id: 14, value: "twitter", label: "Twitter", icon: "/icon/id-con.svg" },
    // { id: 15, value: "marketing", label: "Marketing", icon: "/icon/id-con.svg" },
    // { id: 16, value: "ui-ux", label: "UI/UX", icon: "/icon/id-con.svg" },
    // { id: 17, value: "video", label: "Video", icon: "/icon/id-con.svg" },
    // { id: 18, value: "voice", label: "Voice", icon: "/icon/id-con.svg" },
    // { id: 19, value: "website", label: "Website", icon: "/icon/id-con.svg" },
    // { id: 20, value: "writing", label: "Writing", icon: "/icon/id-con.svg" },
];

export async function insertCategories() {


    for (const category of categories) {
        await db.pool.query(
            `INSERT INTO categories (title, value, icon, priority, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [category.label, category.value, category.icon, 0]
        );
    }

    console.log("Categories inserted successfully.");

}
