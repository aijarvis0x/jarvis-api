export type ItemTypeConfig = {
    name: string;
    valueContract: number;
    img?: string;
};

export const itemTypeConfig: Record<number, ItemTypeConfig> = {
    0: {
        name: "Social Fragment",
        valueContract: 0,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Social_Fragment.png",
    },
    1: {
        name: "Speed Fragment",
        valueContract: 1,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Speed_Fragment.png",
    },
    2: {
        name: "Logic Fragment",
        valueContract: 2,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Logic_Fragment.png",
    },
    3: {
        name: "Endurance Fragment",
        valueContract: 3,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Endurance_Fragment.png",
    },
    4: {
        name: "Creativity Fragment",
        valueContract: 4,
        img: "https://javis-agent.s3.ap-southeast-1.amazonaws.com/items/ss1/Creativity_Fragment.png",
    },
};


export function getItemConfig() {
    return Object.values(itemTypeConfig)
}
