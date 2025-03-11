import dotenv from 'dotenv';

dotenv.config();

export const s3Config = {
	accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
}
