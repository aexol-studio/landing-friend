import fs from "fs";
import path from "path";

import { message } from "@/console.js";

export const saveSitemap = (filePath: string, content: string) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, content);
};

export const saveFile = (filePath: string, content: string) => {
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
