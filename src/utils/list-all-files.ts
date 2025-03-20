import * as fs from "fs";
import * as path from "path";

const getFilesInFolder = (folderPath: string): string[] => {
    return fs.readdirSync(folderPath).map(file => path.join(folderPath, file));
};

const files = getFilesInFolder("./src/utils/anh");
console.log(files);
