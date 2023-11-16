import fs from "fs";
import open, { apps } from "open";
import path from "path";

import {
  AdvancedTagsName,
  AllTagsName,
  checkFiles,
  CombinedPatterns,
  CombineTagsWithReason,
  ConfigFile,
  getHtmlFiles,
  matchedSetting,
  message,
  prepareHTMLWithTables,
  saveAnalyze,
} from "@/index.js";

export const websiteAnalyzer = async (config: ConfigFile, interval: NodeJS.Timer) => {
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
          file,
          input,
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
            keywordsIncluded: tag !== "keywords" ? value.keywordsIncluded : undefined,
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

  const location = "./SEO";
  const fileName = (extension: ".json" | ".html") => `seo-analyze${extension}`;
  const pathname = (extension: ".json" | ".html") => `${location}/${fileName(extension)}`;
  clearTimeout(interval);
  try {
    saveAnalyze(pathname(".json"), JSON.stringify(cleanedTagsPatterns, null, 2));
    saveAnalyze(pathname(".html"), htmlWithTablesAndCharts);
    message(
      "Your website has been analyzed, JSON and html files have been generated in ./SEO",
      "green"
    );
  } catch {
    message("Failed to create files", "red");
  } finally {
    if (fs.existsSync(path.join(process.cwd(), location, fileName(".html")))) {
      try {
        await open(path.join(process.cwd(), location, fileName(".html")), {
          app: { name: apps.browser },
        });
        message("The analysis file has been opened in your browser.", "green");
      } catch {
        message("Cannot open browser. Please open file manually", "red");
      }
    }
  }
};
