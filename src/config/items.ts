export type ItemTypeConfig = {
    name: string;
    valueContract: number;
    img?: string;
    description: string;
};

export const itemTypeConfig: Record<number, ItemTypeConfig> = {
    0: {
        name: "Social Fragment",
        valueContract: 0,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Social_Fragment.png",
        description: "A fragment that enhances communication and teamwork. Perfect for those who thrive in group dynamics."
    },
    1: {
        name: "Speed Fragment",
        valueContract: 1,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Speed_Fragment.png",
        description: "Boosts reaction time and agility. Ideal for quick decision-making and fast-paced challenges."
    },
    2: {
        name: "Logic Fragment",
        valueContract: 2,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Logic_Fragment.png",
        description: "Sharpen your reasoning and problem-solving skills. A must-have for strategic thinkers."
    },
    3: {
        name: "Endurance Fragment",
        valueContract: 3,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Endurance_Fragment.png",
        description: "Increases stamina and resilience. Stay focused and strong through long challenges."
    },
    4: {
        name: "Creativity Fragment",
        valueContract: 4,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Creativity_Fragment.png",
        description: "Unlock your imagination and innovative thinking. Great for creative tasks and artistic exploration."
    },
};



export function getItem(itemType: number) {
    return itemTypeConfig[itemType]
}


export function getItemConfig() {
    return Object.values(itemTypeConfig)
}

export function getItemMetadata(itemType: number) {
    let itemConfig = itemTypeConfig[itemType]
    return {
        name: itemConfig.name,
        image: itemConfig.img,
        description: itemConfig.description
    }
}
