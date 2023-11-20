import fs from "fs";
import open, { apps } from "open";
import path from "path";

import {
  ConfigFile,
  DuplicatedContent,
  DuplicatedContentWithName,
  DuplicatedSearchNameTypes,
  fileLocation,
  FileName,
  fileName,
  FileWithDuplicateContent,
  findAndStoreDuplicates,
  getContent,
  getHtmlFiles,
  matchedSetting,
  message,
  pathName,
  prepareDuplicatedHtml,
  saveFile,
} from "@/index.js";

export const searchDuplicated = async (config: ConfigFile, interval?: NodeJS.Timer) => {
  const { input, domain, searchDuplicated, excludedPage } = config;

  if (!searchDuplicated) {
    return message("Define analyzer in config", "redBright");
  }

  let contentArray: FileWithDuplicateContent[] = [];
  const contentArrayWithDuplication: FileWithDuplicateContent[] = [];
  const dataToJson: FileWithDuplicateContent = {};

  const allHtmlFiles = getHtmlFiles(input, false);

  for (const file of allHtmlFiles) {
    if (!matchedSetting(file, excludedPage)) {
      const fileWithContent = await getContent({
        file: file.replace("\\", "/"),
        input: input.replace(/\.\//g, ""),
      });
      if (contentArray.length > 0) {
        contentArray = findAndStoreDuplicates(fileWithContent, contentArray, file);
      } else {
        contentArray.push(fileWithContent);
      }
    }
  }

  contentArray.forEach(content => {
    Object.entries(content).forEach(([file, value]) => {
      if (!value) return;
      let newSearchContent = {} as DuplicatedContentWithName;
      Object.entries(value).forEach(([_name, content]) => {
        if (!content) return;
        const name = _name as DuplicatedSearchNameTypes;
        if (content.numberOfDuplicates === 0) return;
        newSearchContent = {
          ...newSearchContent,
          [name]: {
            numberOfDuplicates:
              content.numberOfDuplicates === 0 ? undefined : content.numberOfDuplicates,
            duplicatesOnSite:
              content.duplicatesOnSite.length > 0 ? content.duplicatesOnSite : undefined,
            content: name === "samePage" ? undefined : content.content,
          } as DuplicatedContent,
        };
      });
      dataToJson[file] = newSearchContent;
    });
  });

  Object.keys(dataToJson).forEach(key => {
    if (Object.keys(dataToJson[key]).length === 0) {
      delete dataToJson[key];
    }
  });
  Object.entries(dataToJson).forEach(([key, value]) => {
    const dataToArray: FileWithDuplicateContent = {};
    dataToArray[key] = value;
    contentArrayWithDuplication.push(dataToArray);
  });

  const htmlWithTablesAndCharts = prepareDuplicatedHtml({
    dataArray: contentArrayWithDuplication,
    domain: domain,
  });

  clearTimeout(interval);
  try {
    saveFile(pathName(FileName.duplicated, ".json"), JSON.stringify(dataToJson, null, 2));
    saveFile(pathName(FileName.duplicated, ".html"), htmlWithTablesAndCharts);
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
