import AWS from "aws-sdk";
import * as fs from "fs";
import * as path from "path";
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình AWS S3
const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY || 'AKIA...',
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'jEwl...',
	region: process.env.AWS_REGION || 'ap-southeast-1'
}
);

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const LOCAL_FOLDER = "./src/utils/anh"; // Thư mục chứa ảnh mới
const POOLS = ["pool1", "pool2", "pool3", "pool4", "pool5"]; // Danh sách folder trên S3

// Hàm lấy danh sách file trong một folder trên S3
const listFilesInS3Folder = async (folder: string): Promise<string[]> => {
    const params = {
        Bucket: BUCKET_NAME as string,
        Prefix: `${folder}/`, // Chỉ lấy file trong folder này
    };

    try {
        const response = await s3.listObjectsV2(params).promise();
        return (response.Contents || []).map(item => item.Key || "");
    } catch (error) {
        console.error(`Lỗi khi lấy danh sách file từ ${folder}:`, error);
        return [];
    }
};

// Hàm lấy danh sách ảnh từ thư mục local
const getLocalImages = (): string[] => {
    return fs.readdirSync(LOCAL_FOLDER)
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // Chỉ lấy file ảnh
        .map(file => path.join(LOCAL_FOLDER, file)); // Trả về đường dẫn đầy đủ
};

// Hàm upload ảnh lên S3
const uploadImageToS3 = async (localFilePath: string, s3Key: string) => {
    try {
        const fileStream = fs.createReadStream(localFilePath);
        const params = {
            Bucket: BUCKET_NAME as string,
            Key: s3Key,
            Body: fileStream,
            ContentType: "image/png", // Hoặc "image/png" tùy loại ảnh
        };

        await s3.upload(params).promise();
        console.log(`✔ Ghi đè: ${s3Key} bằng ảnh ${localFilePath}`);
    } catch (error) {
        console.error(`❌ Lỗi khi upload ${s3Key}:`, error);
    }
};

// Hàm chính: lấy danh sách file trên S3 và ghi đè bằng ảnh mới
const replaceImagesOnS3 = async () => {
    const localImages = getLocalImages();
    if (localImages.length === 0) {
        console.error("❌ Không tìm thấy ảnh nào trong thư mục local.");
        return;
    }

    for (const pool of POOLS) {
        const s3Files = await listFilesInS3Folder(pool);

        if (s3Files.length === 0) {
            console.warn(`⚠ Không có file nào trong ${pool}, bỏ qua.`);
            continue;
        }

        for (const s3File of s3Files) {
            const randomImage = localImages[Math.floor(Math.random() * localImages.length)]; // Chọn ảnh ngẫu nhiên
            await uploadImageToS3(randomImage, s3File); // Upload và ghi đè
        }
    }
};

const writeToFile = (filePath: string, data: string | object, append: boolean = false) => {
	try {
			const content = typeof data === "object" ? JSON.stringify(data, null, 2) : data; // Chuyển object thành JSON nếu cần
			if (append) {
					fs.appendFileSync(filePath, content + "\n", "utf-8"); // Ghi tiếp vào file
			} else {
					fs.writeFileSync(filePath, content, "utf-8"); // Ghi đè file
			}
			console.log(`✔ Ghi dữ liệu vào file thành công: ${filePath}`);
	} catch (error) {
			console.error(`❌ Lỗi khi ghi file:`, error);
	}
};

// Chạy chương trình
replaceImagesOnS3();
// console.log(await listFilesInS3Folder("pool5"))
// writeToFile("./src/utils/old-filename-s3/pool5.txt",await listFilesInS3Folder("pool5"))
// console.log(getLocalImages());

