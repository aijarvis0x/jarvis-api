// image-pool-manager.js
import {S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import AWS from 'aws-sdk';
import {v4 as uuidv4} from 'uuid';
import type { PoolClient, QueryConfig } from "pg"
import { db } from "../lib/pg.js"
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client


// Configuration for image pools
const POOL_CONFIG = {
  // 5 different pool types
  pool1Cryptoman: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool1Cryptoman/'
  },
  pool2Cryptoman: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool2Cryptoman/'
  },
  pool3Cryptoman: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool3Cryptoman/'
  },
  pool1Nurse: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool1Nurse/'
  },
  pool2Nurse: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool2Nurse/'
  },
  pool3Nurse: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool3Nurse/'
  },
  pool1Anime: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool1Anime/'
  },
  pool2Anime: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool2Anime/'
  },
  pool3Anime: {
    bucketName: process.env.AWS_S3_BUCKET,
    folderPrefix: 'pool3Anime/'
  },

};

// Configure package types with their respective pools and rates
const AGENT_TYPES = {
  0: {
    name: 'MonCryptoMan',
    packages: {
      0: {
        name: 'Mint Package',
        availablePools: [
          { pool: 'pool1Cryptoman', defaultRate: 0.6 },
          { pool: 'pool2Cryptoman', defaultRate: 0.3 },
          { pool: 'pool3Cryptoman', defaultRate: 0.1 }
        ]
      },
      1: {
        name: 'Premium Package',
        availablePools: [
          { pool: 'pool2Cryptoman', defaultRate: 0.4 },
          { pool: 'pool3Cryptoman', defaultRate: 0.4 },
          { pool: 'pool1Cryptoman', defaultRate: 0.2 }
        ]
      },
      2: {
        name: 'Premium Package',
        availablePools: [
          { pool: 'pool2Cryptoman', defaultRate: 0.4 },
          { pool: 'pool1Cryptoman', defaultRate: 0.4 },
          { pool: 'pool3Cryptoman', defaultRate: 0.2 }
        ]
      }
    }
  },
  1: {
    name: 'MonNurse',
    packages: {
      0: {
        name: 'Elite Package',
        availablePools: [
          { pool: 'pool1Nurse', defaultRate: 0.3 },
          { pool: 'pool2Nurse', defaultRate: 0.3 },
          { pool: 'pool3Nurse', defaultRate: 0.4 }
        ]
      },
      1: {
        name: 'Standard Package',
        availablePools: [
          { pool: 'pool1Nurse', defaultRate: 0.4 },
          { pool: 'pool3Nurse', defaultRate: 0.4 },
          { pool: 'pool2Nurse', defaultRate: 0.2 }
        ]
      },
      2: {
        name: 'Standard Package',
        availablePools: [
          { pool: 'pool2Nurse', defaultRate: 0.4 },
          { pool: 'pool1Nurse', defaultRate: 0.4 },
          { pool: 'pool3Nurse', defaultRate: 0.2 }
        ]
      }
    }
  },
  2: {
    name: 'MonAnime',
    packages: {
      0: {
        name: 'Elite Package',
        availablePools: [
          { pool: 'pool3Anime', defaultRate: 0.3 },
          { pool: 'pool2Anime', defaultRate: 0.3 },
          { pool: 'pool1Anime', defaultRate: 0.4 }
        ]
      },
      1: {
        name: 'Standard Package',
        availablePools: [
          { pool: 'pool2Anime', defaultRate: 0.4 },
          { pool: 'pool3Anime', defaultRate: 0.4 },
          { pool: 'pool1Anime', defaultRate: 0.2 }
        ]
      },
      2: {
        name: 'Standard Package',
        availablePools: [
          { pool: 'pool2Anime', defaultRate: 0.4 },
          { pool: 'pool1Anime', defaultRate: 0.4 },
          { pool: 'pool3Anime', defaultRate: 0.2 }
        ]
      }
    }
  }
};

// Helper function to list available images in a pool
async function listAvailableImages(s3: AWS.S3, pool) {

  const { bucketName, folderPrefix } = POOL_CONFIG[pool];

  const params = {
    Bucket: bucketName,
    Prefix: folderPrefix
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
  const allImages = await listAvailableImages(s3Client, selectedPool);

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
  const url = `https://${POOL_CONFIG[selectedPool].bucketName}.s3.amazonaws.com/${selectedImage.key}`
  await saveUsedImages(selectedImage.key, url, agentId, packageId);

  // Return the selected image info
  return {
    imageKey: selectedImage.key,
    pool: selectedPool,
    url
  };
}

// Register routes
