import fs from "fs";
import path from "path";
import { message } from "./console.js";

export const getHtmlFiles = (base: string) => {
  const allFiles = getDirectories(base);
  const baseWithoutDot = base.replace(/\.\//g, "");
  const cleanFiles = allFiles
    .map((file) => {
      const relativePath = file.replace(baseWithoutDot, "");
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
      getDirectories(filePath, fileList);
    } else fileList.push(filePath);
  });

  return fileList;
};

export const readFile = (filePath: string) => {
  return fs.readFileSync(filePath, "utf8");
};

export const saveSitemap = (filePath: string, content: string) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, content);
};

export const saveAnalyze = (filePath: string, content: string) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    message(`Folder SEO was created in ${directory}`, "yellow");
  }
  fs.writeFileSync(filePath, content);
};

export const saveOldSitemap = (filePath: string, newFilePath: string) => {
  if (fs.existsSync(filePath)) {
    if (!fs.existsSync(newFilePath)) {
      fs.mkdirSync(newFilePath, { recursive: true });
      message(`Folder SEO was created in ${newFilePath}`, "yellow");
    }
    fs.copyFileSync(filePath, `${newFilePath}/sitemapOld.xml`);
    message(`Old sitemap detected. Moved to ${newFilePath}`, "green");
  }
};
