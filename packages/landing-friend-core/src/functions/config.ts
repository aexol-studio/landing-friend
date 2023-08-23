import { message } from "../index.js";
import fs from "fs";
import path from "path";

export const getHtmlFiles = (base: string) => {
  const baseWithoutDot = base.replace(/\.\//g, "");
  return getDirectories(base)
    .map((file) => {
      const relativePath = file.replace(baseWithoutDot, "");
      return relativePath.replace(/\\/g, "/");
    })
    .filter((file) => file.endsWith(".html") || file.endsWith(".php"))
    .map((file) => file.replace(".html", ""));
};

export const getFilesToAnalyze = (base: string) => {
  return getDirectories(base)
    .map((file) => file.replace(/\\/g, "/"))
    .filter((file) => file.endsWith(".html") || file.endsWith(".php"))
    .map((file) => {
      const relativePath = file.replace(/\\/g, "/");
      const pathToFileOpen = path.join(process.cwd(), relativePath);
      return pathToFileOpen;
    });
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

export const matchedSetting = (
  file: string,
  paths: string[],
  input?: string
) => {
  if (input) {
    const fileWithoutIndex = file
      .replace(".html", "")
      .replace("index", "")
      .replace(process.cwd() + input.replace("./", "/"), "");
    file = fileWithoutIndex.endsWith("/")
      ? fileWithoutIndex
      : fileWithoutIndex + "/";
  }
  {
    file = file.endsWith("/") ? file : file + "/";
  }

  if (paths.length > 0) {
    if (
      paths.find((path) => {
        const regexPattern = path
          .replace(/\/$/g, "/$")
          .replace(/^\.\//g, `^\/`)
          .replace("*/", "/")
          .replace("/*", "/");
        return file.match(new RegExp(regexPattern, "g")) !== null;
      })
    ) {
      return true;
    }
  }
  return false;
};
