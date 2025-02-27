import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fastifyMultipart from "fastify-multipart";
import { v4 as uuidv4 } from "uuid";
import type { FastifyInstance } from "fastify";

// AWS S3 configuration (using AWS SDK v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

declare module "fastify" {
  interface FastifyInstance {
    uploadFileToS3: (
      mimeType: string,
      folder: string,
      id: string,
      fileSize: number
    ) => Promise<{ url: string; key: string }>;
  }
}
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const configureFileUpload = async (app: FastifyInstance) => {
  // Register fastify-multipart plugin
  app.register(fastifyMultipart);

  app.decorate(
    "uploadFileToS3",
    async (mimeType: string, folder: string, id: string, fileSize: number) => {
      const allowedExtensions = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedExtensions.includes(mimeType)) {
        throw new Error("Invalid file type. Only .png and .jpg files are allowed.");
      }

      if (fileSize > MAX_FILE_SIZE) {
        throw app.httpErrors.badRequest("File size exceeds the 5 MB limit.");
      }

      const fileExtension = mimeType.split("/")[1];
      const key = `uploads/${folder}/${id}/${uuidv4()}-${Date.now()}.${fileExtension}`;

      if (!process.env.AWS_S3_BUCKET) {
        throw new Error("AWS_S3_BUCKET is not defined in environment variables");
      }

      // Generate a signed URL for uploading
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentLength: fileSize,
        ContentType: mimeType,
        ACL: "public-read",
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 7200 });

      return {
        url: signedUrl,
        key: key,
      };
    }
  );
};

export default configureFileUpload;
