import fs from "fs";
import open, { apps } from "open";
import path from "path";

import {
  AdditionalTagsName,
  AdvancedTagsName,
  AllTagsName,
  checkFiles,
  CombinedPatterns,
  CombineTagsWithReason,
  ConfigFile,
  fileLocation,
  FileName,
  fileName,
  getHtmlFiles,
  matchedSetting,
  message,
  pathName,
  prepareHTMLWithTables,
  saveFile,
} from "@/index.js";

export const websiteAnalyzer = async (config: ConfigFile, interval?: NodeJS.Timer) => {
  const { input, analyzer, advancedAnalyzer, excludedPage, sitemap, domain } = config;
  if (!analyzer) {
    return message("Define analyzer in config", "redBright");
  }

  const allHtmlFiles = getHtmlFiles(input, false);
  const combinedTagsPatternsArray: CombinedPatterns[] = [];

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
      combinedTagsPatternsArray.push(
        await checkFiles({
          file: file.replace("\\", "/"),
          input: input.replace(/\.\//g, ""),
          tags: analyzer,
          advancedTags: advancedAnalyzer,
          domain,
          countKeywords: analyzer.keywords.count,
          countWordsInLast: analyzer.lastSentence.count,
        })
      );
    }
  }

  const htmlWithTablesAndCharts = prepareHTMLWithTables({
    combinedTagsPatterns: combinedTagsPatternsArray,
    countKeywords: analyzer.keywords.count,
    countWordsInLast: analyzer.lastSentence.count,
    advancedAnalyzer: !!advancedAnalyzer,
    trailingSlash: sitemap?.trailingSlash,
    domain,
  });

  const cleanedTagsPatterns: CombinedPatterns = {};
  combinedTagsPatternsArray.forEach(combinedTagsPatterns => {
    Object.entries(combinedTagsPatterns).forEach(([file, tagData]) => {
      let tagArray = {} as Record<AllTagsName, CombineTagsWithReason>;
      Object.entries(tagData).forEach(([_tag, _value]) => {
        const tag = _tag as AllTagsName;
        const value = _value as CombineTagsWithReason;
        tagArray = {
          ...tagArray,
          [tag]: {
            requirement: value.requirement && value.requirement.replace(/<\/?strong>/gs, ""),
            quantity: value.quantity,
            content: value.content,
            forbiddenCharacters: value.forbiddenCharacters,
            keywordsIncluded:
              tag !== AdditionalTagsName.Keywords ? value.keywordsIncluded : undefined,
            multipleTags: value.multipleTags,
            tagAmount: tag in AdvancedTagsName ? value.tagAmount : undefined,
            listOfFoundMeta: value.listOfFoundMeta,
            isError: value.isError,
            missingKeywords: value.missingKeywords,
            toMuchKeywords: value.toMuchKeywords,
          } as CombineTagsWithReason,
        } as Record<AllTagsName, CombineTagsWithReason>;
      });
      cleanedTagsPatterns[file] = tagArray;
    });
  });

  clearTimeout(interval);
  try {
    saveFile(pathName(FileName.analyze, ".json"), JSON.stringify(cleanedTagsPatterns, null, 2));
    saveFile(pathName(FileName.analyze, ".html"), htmlWithTablesAndCharts);
    message(
      "Your website has been analyzed, JSON and html files have been generated in ./SEO",
      "green"
    );
  } catch {
    message("Failed to create files", "red");
  } finally {
    if (
      fs.existsSync(path.join(process.cwd(), fileLocation, fileName(FileName.analyze, ".html")))
    ) {
      try {
        await open(path.join(process.cwd(), fileLocation, fileName(FileName.analyze, ".html")), {
          app: { name: apps.browser },
        });
        message("The analysis file has been opened in your browser.", "green");
      } catch {
        message("Cannot open browser. Please open file manually", "red");
      }
    }
  }
};
