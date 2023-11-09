import path from "path";
import open, { apps } from "open";
import {
  ConfigFile,
  matchedSetting,
  message,
  checkFiles,
  prepareHTMLWithTables,
  CombinedPatterns,
  AllTagsName,
  saveAnalyze,
  CombineTagsWithReason,
  getHtmlFiles,
  advancedTagsName,
} from "./index.js";

export const websiteAnalyzer = async (config: ConfigFile) => {
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
        if (
          !(tag === "keywords" && analyzer.keywords.count) &&
          !(tag === "lastSentence" && analyzer.lastSentence.count)
        ) {
          tagArray = {
            ...tagArray,
            [tag]: {
              requirement: value.requirement && value.requirement.replace(/<\/?strong>/gs, ""),
              quantity: value.quantity,
              content: value.content,
              forbiddenCharacters: value.forbiddenCharacters,
              keywordsIncluded: tag !== "keywords" ? value.keywordsIncluded : undefined,
              multipleTags: value.multipleTags,
              tagAmount: tag in advancedTagsName ? value.tagAmount : undefined,
              listOfFoundMeta: value.listOfFoundMeta,
            } as CombineTagsWithReason,
          } as Record<AllTagsName, CombineTagsWithReason>;
        } else {
          tagArray = {
            ...tagArray,
            [tag]: {
              requirement: value.requirement && value.requirement.replace(/<\/?strong>/gs, ""),
              quantity: value.quantity,
              content: value.content,
              forbiddenCharacters: value.forbiddenCharacters,
              keywordsIncluded: tag !== "keywords" ? value.keywordsIncluded : undefined,
              multipleTags: value.multipleTags,
              tagAmount: value.tagAmount,
            } as CombineTagsWithReason,
          } as Record<AllTagsName, CombineTagsWithReason>;
        }
      });
      cleanedTagsPatterns[file] = tagArray;
    });
  });
  try {
    saveAnalyze("./SEO/seo-analyze.json", JSON.stringify(cleanedTagsPatterns, null, 2));
    saveAnalyze("./SEO/seo-analyze.html", htmlWithTablesAndCharts);
    message(
      "Your website has been analyzed, JSON and html files have been generated in ./SEO",
      "green"
    );
  } catch {
    message("Failed to create files", "red");
    return;
  }
  try {
    await open(path.join(process.cwd(), "./SEO", "seo-analyze.html"), {
      app: { name: apps.browser },
    });
    message("The analysis file has been opened in your browser.", "green");
  } catch {
    message("Cannot open browser. Please open file manually", "red");
    return;
  }
};
