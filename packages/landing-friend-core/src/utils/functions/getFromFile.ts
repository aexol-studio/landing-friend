import fs from "fs";
import path from "path";

export const readFile = (filePath: string) => {
  return fs.readFileSync(filePath, "utf8");
};

export const getHtmlFiles = (base: string, deleteFileExtension: boolean) => {
  const baseWithoutDot = base.replace(/\.\//g, "");

  return getDirectories(base)
    .map(file => {
      const relativePath = file.replace(baseWithoutDot, "");
      return relativePath.replace(/\\/g, "/");
    })
    .filter(file => file.endsWith(".html") || file.endsWith(".php"))
    .map(file => (deleteFileExtension ? file.replace(/\.html|\.php/g, "") : file));
};

export const getDirectories = (dir: string, fileList = [] as string[]) => {
  const files = fs.readdirSync(dir);
  files.forEach((file: string) => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      getDirectories(filePath, fileList);
    } else fileList.push(filePath);
  });

  return fileList;
};
