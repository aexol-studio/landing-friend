import fs from "fs";
import open, { apps } from "open";
import path from "path";

import {
  ConfigFile,
  fileLocation,
  FileName,
  fileName,
  FileWithDuplicateContent,
  getContent,
  getHtmlFiles,
  matchedSetting,
  message,
  pathName,
  saveFile,
} from "@/index.js";

export const searchDuplicated = async (config: ConfigFile, interval?: NodeJS.Timer) => {
  const { input, searchDuplicated, excludedPage } = config;

  if (!searchDuplicated) {
    return message("Define analyzer in config", "redBright");
  }

  const contentArray: FileWithDuplicateContent[] = [];

  const allHtmlFiles = getHtmlFiles(input, false);

  for (const file of allHtmlFiles) {
    if (
      !matchedSetting(
        file
          .replace("\\", "/")
          .replace(/\.html|\.php/g, "")
          .replace(/index/g, "")
          .replace(/\/$/g, ""),
        excludedPage
      )
    ) {
      contentArray.push(
        await getContent({
          file: file.replace("\\", "/"),
          input: input.replace(/\.\//g, ""),
        })
      );
    }
  }

  clearTimeout(interval);
  try {
    saveFile(pathName(FileName.duplicated, ".json"), JSON.stringify(contentArray, null, 2));
    // saveFile(pathName(FileName.duplicated, ".html"), htmlWithTablesAndCharts);
    message(
      "Your website has been analyzed, JSON and html files have been generated in ./SEO",
      "green"
    );
  } catch {
    message("Failed to create files", "red");
  } finally {
    if (
      fs.existsSync(path.join(process.cwd(), fileLocation, fileName(FileName.duplicated, ".html")))
    ) {
      try {
        await open(path.join(process.cwd(), fileLocation, fileName(FileName.duplicated, ".html")), {
          app: { name: apps.browser },
        });
        message("The analysis file has been opened in your browser.", "green");
      } catch {
        message("Cannot open browser. Please open file manually", "red");
      }
    }
  }
};
