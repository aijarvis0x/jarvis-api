import * as fs from "fs";
import * as path from "path";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import dotenv from 'dotenv';

dotenv.config();



const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY || 'AKIA...',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'jEwl...',
  region: process.env.AWS_REGION || 'ap-southeast-1'
}
);

const localFolder = "./src/utils/anh/anh"; // Thư mục chứa ảnh
const s3Bucket = process.env.AWS_S3_BUCKET as string; // Tên S3 Bucket

// Map folder S3 theo loại ảnh
const folderMapping: Record<string, string[]> = {
    Trader: ["pool1Cryptoman", "pool2Cryptoman", "pool3Cryptoman"],
    Nurse: ["pool1Nurse", "pool2Nurse", "pool3Nurse"],
    Anime: ["pool1Anime", "pool2Anime", "pool3Anime"],
};

/**
 * Lấy danh sách file ảnh trong thư mục
 */
const getImageFiles = (directory: string): string[] => {
    return fs.readdirSync(directory).filter(file => /\.(jpg|jpeg|png)$/i.test(file));
};

/**
 * Chọn ngẫu nhiên ảnh và đổi tên
 */
const selectRandomImages = (files: string[], count: number): string[] => {
    const selected: string[] = [];
    while (selected.length < count) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const uniqueName = `${uuidv4()}_${randomFile}`; // Đổi tên file để tránh trùng
        selected.push(uniqueName);
    }
    return selected;
};

/**
 * Upload file lên S3
 */
const uploadImage = async (filePathLocal: string, filePathS3: string) => {
    const fileContent = fs.readFileSync(filePathLocal);
    const params = {
        Bucket: s3Bucket,
        Key: filePathS3,
        Body: fileContent,
        ContentType: "image/png", // Có thể cần điều chỉnh theo file thực tế
    };

    try {
        await s3.upload(params).promise();
        console.log(`✔ Uploaded: ${filePathS3}`);
    } catch (error) {
        console.error(`❌ Lỗi khi upload ${filePathS3}:`, error);
    }
};

/**
 * Xử lý upload ảnh
 */
const processUpload = async () => {
    const allImages = getImageFiles(localFolder);

    for (const [type, folders] of Object.entries(folderMapping)) {
        // Lọc ảnh theo loại
        const filteredImages = allImages.filter(img => img.includes(type));

        if (filteredImages.length === 0) {
            console.log(`⚠ Không có ảnh nào cho loại: ${type}`);
            continue;
        }

        for (const folder of folders) {
            const selectedImages = selectRandomImages(filteredImages, 100);

            for (const newFileName of selectedImages) {
                const originalFileName = newFileName.split("_").slice(1).join("_"); // Lấy tên gốc
                const localFilePath = path.join(localFolder, originalFileName);
                const s3FilePath = `${folder}/${newFileName}`;

                await uploadImage(localFilePath, s3FilePath);
            }
        }
    }
};

processUpload();
