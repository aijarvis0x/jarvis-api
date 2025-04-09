// image-pool-manager.js
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import type { PoolClient, QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client


export const enum RARE {
  common = "common",
  rare = "rare",
  epic = "epic",
  legendary = "legendary",
  mythic = "mythic"
}

const enum COLLECTION {
  anime = "anime",
  nurse = "nurse",
  cryptoman = "cryptoman",
}

export const ASSET_COLLECTION_PATH: Record<COLLECTION, string> = {
  [COLLECTION.anime]: "assets/anime/ss3/",
  [COLLECTION.nurse]: 'assets/nurse/ss3/',
  [COLLECTION.cryptoman]: 'assets/cryptoman/ss3/'
}


// Configure package types with their respective pools and rates
const AGENT_TYPES = {
  0: {
    name: 'Cryptoman',
    packages: {
      0: {
        name: 'Silver Package',
        availablePools: [
          { pool: RARE.common, defaultRate: 0.6 },
          { pool: RARE.rare, defaultRate: 0.3 },
          { pool: RARE.epic, defaultRate: 0.1 }
        ]
      },
      1: {
        name: 'Golden Package',
        availablePools: [
          { pool: RARE.rare, defaultRate: 0.4 },
          { pool: RARE.epic, defaultRate: 0.4 },
          { pool: RARE.legendary, defaultRate: 0.2 }
        ]
      },
      2: {
        name: 'Diamond Package',
        availablePools: [
          { pool: RARE.epic, defaultRate: 0.4 },
          { pool: RARE.legendary, defaultRate: 0.4 },
          { pool: RARE.mythic, defaultRate: 0.2 },

        ]
      }
    }
  },
  1: {
    name: 'Nurse',
    packages: {
      0: {
        name: 'Silver Package',
        availablePools: [
          { pool: RARE.common, defaultRate: 0.6 },
          { pool: RARE.rare, defaultRate: 0.3 },
          { pool: RARE.epic, defaultRate: 0.1 }
        ]
      },
      1: {
        name: 'Golden Package',
        availablePools: [
          { pool: RARE.rare, defaultRate: 0.4 },
          { pool: RARE.epic, defaultRate: 0.4 },
          { pool: RARE.legendary, defaultRate: 0.2 }
        ]
      },
      2: {
        name: 'Diamond Package',
        availablePools: [
          { pool: RARE.epic, defaultRate: 0.4 },
          { pool: RARE.legendary, defaultRate: 0.4 },
          { pool: RARE.mythic, defaultRate: 0.2 },

        ]
      }
    }
  },
  2: {
    name: 'Anime',
    packages: {
      0: {
        name: 'Silver Package',
        availablePools: [
          { pool: RARE.common, defaultRate: 0.6 },
          { pool: RARE.rare, defaultRate: 0.3 },
          { pool: RARE.epic, defaultRate: 0.1 }
        ]
      },
      1: {
        name: 'Golden Package',
        availablePools: [
          { pool: RARE.rare, defaultRate: 0.4 },
          { pool: RARE.epic, defaultRate: 0.4 },
          { pool: RARE.legendary, defaultRate: 0.2 }
        ]
      },
      2: {
        name: 'Diamond Package',
        availablePools: [
          { pool: RARE.epic, defaultRate: 0.4 },
          { pool: RARE.legendary, defaultRate: 0.4 },
          { pool: RARE.mythic, defaultRate: 0.2 },
        ]
      }
    }
  }
};

// Helper function to list available images in a pool
async function listAvailableImages(s3: AWS.S3, agentId, pool: string) {

  let prefix = ""
  switch (agentId) {
    case 0:
      prefix = ASSET_COLLECTION_PATH.cryptoman
      break;
    case 1:
      prefix = ASSET_COLLECTION_PATH.nurse

      break;
    case 2:
      prefix = ASSET_COLLECTION_PATH.anime

      break;

    default:
      break;
  }


  const bucketName = process.env.AWS_S3_BUCKET
  const params = {
    Bucket: String(bucketName),
    Prefix: String(prefix + pool)
  };

  const data = await s3.listObjectsV2(params).promise();

  if (!data) {
    throw new Error("no image")
  } else if (!data.Contents) {
    throw new Error("no content")
  }

  // Extract image keys
  return data.Contents.map(item => ({
    key: item.Key,
    pool
  }));
}

async function loadUsedImages() {
  const statement = {
    name: "loadUsedImages",
    text: "SELECT * FROM mint_image_history",
  };

  return await db.pool.query(statement)
    .then((result) => {
      return result.rows.reduce((obj, row) => {
        const { imageName, ...rest } = row; // Tách imageName
        obj[imageName] = rest; // Dùng imageName làm key
        return obj;
      }, {});
    });
}

async function saveUsedImages(imageName, url, agentType, packageType) {
  const query = `
    INSERT INTO mint_image_history
      (
        "imageName",
        url,
        "agentType",
        "packageType"
      )
    VALUES
      ($1, $2, $3, $4)
    RETURNING id;
  `;

  const values = [imageName, url, agentType, packageType];

  try {
    await db.pool.query(query, values);
  } catch (error) {
    throw error;
  }
}

// Helper function to select an image from a pool based on rates
export async function selectImageFromPool(s3Config, agentId, packageId, customRates = null) {
  const s3Client = new AWS.S3(s3Config)
  // Get package configuration
  const agent = AGENT_TYPES[agentId].packages;
  const packageConfig = agent[packageId];
  if (!packageConfig) {
    throw new Error(`Invalid package agentType: ${agentId} or packageType: ${packageId}`);
  }

  // Load used images
  const usedImages = await loadUsedImages();

  // Prepare rates to use
  const rates = customRates || packageConfig.availablePools.map(p => p.defaultRate);

  // Validate rates sum to 1
  const rateSum = rates.reduce((sum, rate) => sum + rate, 0);
  if (Math.abs(rateSum - 1) > 0.001) {
    throw new Error(`Rates must sum to 1. Current sum: ${rateSum}`);
  }

  // Determine which pool to use based on rates
  const randomValue = Math.random();
  let cumulativeRate = 0;
  let selectedPoolIndex = -1;

  for (let i = 0; i < rates.length; i++) {
    cumulativeRate += rates[i];
    if (randomValue <= cumulativeRate) {
      selectedPoolIndex = i;
      break;
    }
  }

  if (selectedPoolIndex === -1) {
    throw new Error('Failed to select a pool');
  }

  // Get the selected pool
  const selectedPool = packageConfig.availablePools[selectedPoolIndex].pool;

  // Get all available images from the selected pool
  const allImages = await listAvailableImages(s3Client, agentId, selectedPool);

  // Filter out used images
  const availableImages = allImages.filter(image =>
    !usedImages[image.key as string]
  );


  if (availableImages.length === 0) {
    throw new Error(`No available images in pool: ${selectedPool}`);
  }

  // Randomly select an image from the available images
  const randomIndex = Math.floor(Math.random() * availableImages.length);
  const selectedImage = availableImages[randomIndex];

  // Save updated used images
  const url = `https://${String(process.env.AWS_S3_BUCKET)}.s3.amazonaws.com/${selectedImage.key}`
  await saveUsedImages(selectedImage.key, url, agentId, packageId);

  // Return the selected image info
  return {
    imageKey: selectedImage.key,
    rare: selectedPool,
    url
  };
}

// Register routes
