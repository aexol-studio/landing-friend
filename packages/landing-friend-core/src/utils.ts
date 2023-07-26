import fs from "fs";
import path from "path";

export const getHtmlFiles = (dir: string, fileList = [] as string[]) => {
  const files = fs.readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      getHtmlFiles(filePath, fileList);
    } else if (path.extname(filePath) === ".html") {
      fileList.push(filePath.replace(/\\/g, "/"));
    }
  });

  return fileList;
};

export const saveFile = (filePath: string, content: string) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
};
