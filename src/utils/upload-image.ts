import * as fs from "fs";
import * as path from "path";

import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();



const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY || 'AKIA...',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'jEwl...',
  region: process.env.AWS_REGION || 'ap-southeast-1'
}
);

// Hàm upload ảnh
const uploadImage = async (filePath, key) => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: key, // Tên file trên S3
      Body: fileContent,
      ContentType: 'image/jpeg', // Cập nhật theo định dạng ảnh của bạn
      ACL: 'public-read' // Để file có thể truy cập công khai
    };

    const data = await s3.upload(params).promise();
    console.log('Upload thành công:', data.Location);
    return data.Location;
  } catch (error) {
    console.error('Lỗi upload:', error);
    return null;
  }
};

// Hàm chọn ngẫu nhiên một phần tử từ mảng
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Hàm chọn 20 ảnh ngẫu nhiên và đảm bảo mỗi ảnh có tên khác nhau
const getRandomImages = (imagePaths: string[], count: number): any[] => {
    const selectedImages: any[] = [];
    for (let i = 0; i < count; i++) {
        const originalImage = getRandomItem(imagePaths);
        const ext = path.extname(originalImage);
        const newFileName = `${Date.now()}_${i}${ext}`;
        selectedImages.push({ originalImage, newFileName });
    }
    return selectedImages;
};

// Hàm upload ảnh lên S3
const uploadImagesToS3 = async (localFolder: string) => {
    // Lấy danh sách tất cả các file ảnh trong thư mục local
    const allImages = fs.readdirSync(localFolder)
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // Chỉ lấy file ảnh
        .map(file => path.join(localFolder, file)); // Đường dẫn đầy đủ

    if (allImages.length === 0) {
        console.error("Không tìm thấy ảnh nào trong thư mục.");
        return;
    }

    // Upload cho từng pool (pool1 → pool5)
    for (let poolIndex = 1; poolIndex <= 5; poolIndex++) {
        const poolName = `pool${poolIndex}`;
        const selectedImages = getRandomImages(allImages, 20);

        for (const { originalImage, newFileName } of selectedImages) {
            const s3Path = `${poolName}/${newFileName}`;
            await uploadImage(originalImage, s3Path);
            console.log(`Uploaded: ${originalImage} -> ${s3Path}`);
        }
    }
};

// Gọi hàm upload
uploadImagesToS3("./src/utils/anh"); // Thay đổi đường dẫn nếu cần
