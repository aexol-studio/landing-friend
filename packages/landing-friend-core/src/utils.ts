import fs from "fs";
import path from "path";

export const getHtmlFiles = (base: string) => {
  const allFiles = getDirectories(base);
  const baseWithoutDot = base.replace(/\.\//g, "");
  const cleanFiles = allFiles
    .map((file) => {
      const relativePath = file
        .replace(baseWithoutDot, "")
        .replace(/index/g, "");
      return relativePath.replace(/\\/g, "/");
    })
    .filter((file) => file.endsWith(".html") || !file.trim().includes(" "));

  return cleanFiles.map((file) => file.replace(".html", ""));
};

export const getFilesToAnalyze = (base: string) => {
  const allFiles = getDirectories(base);

  const cleanFiles = allFiles
    .map((file) => file.replace(/\\/g, "/"))
    .filter((file) => file.endsWith(".html"));

  const filesToOpen = cleanFiles.map((file) => {
    const relativePath = file.replace(/\\/g, "/");
    const pathToFileOpen = path.join(process.cwd(), relativePath);
    return pathToFileOpen;
  });

  return filesToOpen;
};

export const getDirectories = (dir: string, fileList = [] as string[]) => {
  const files = fs.readdirSync(dir);
  files.forEach((file: string) => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      fileList.push(filePath);
      getDirectories(filePath, fileList);
    } else fileList.push(filePath);
  });

  return fileList;
};

export const readFile = (filePath: string) => {
  return fs.readFileSync(filePath, "utf8");
};

export const saveFile = (filePath: string, content: string) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, content);
};
