import path from "path";
import open, { apps } from "open";
import {
  AdvancedTagsProps,
  ConfigFile,
  TagsProps,
  getFilesToAnalyze,
  matchedSetting,
  saveAnalyze,
  message,
  forbiddenCharacters as _forbiddenCharacters,
  TagsPatterns,
  AdvancedTagsPatterns,
  checkFiles,
  prepareHTMLWithTables,
  BasicTagsName,
} from "./index.js";

export const websiteAnalyzer = (config: ConfigFile) => {
  const { input, analyzer, advancedAnalyzer, excludedPage } = config;
  if (!analyzer) {
    return {
      analyze: async () => message("Define analyzer in config", "redBright"),
    };
  }
  const tags: TagsProps = analyzer;
  const advancedTags: AdvancedTagsProps | undefined = advancedAnalyzer;

  const analyze = async () => {
    const allFiles = getFilesToAnalyze(input);
    let tagsPatterns: TagsPatterns = {};
    let advancedTagsPatterns: AdvancedTagsPatterns = {};

    allFiles.forEach((file) => {
      if (!matchedSetting(file, excludedPage, input)) {
        const allTagsPatterns = checkFiles({
          file,
          tags,
          advancedTags,
          tagsPatterns,
          advancedTagsPatterns,
          countKeywords: tags.keywords.count,
          countWordsInLast: tags.lastSentence.count,
        });
        tagsPatterns = allTagsPatterns.basicAnalyze;
        if (allTagsPatterns.advancedAnalyze) {
          advancedTagsPatterns = allTagsPatterns.advancedAnalyze;
        }
      }
    });

    const htmlWithTablesAndCharts = prepareHTMLWithTables(
      {
        tagsPatterns,
        advancedTagsPatterns,
      },
      tags.keywords.count
    );

    if (analyzer) {
      let cleanedTagsPatterns: TagsPatterns = {};
      Object.entries(tagsPatterns).forEach(([file, tagData]) => {
        cleanedTagsPatterns[file] = { ...cleanedTagsPatterns[file] };
        Object.entries(tagData).forEach(([_tag, value]) => {
          const tag = _tag as BasicTagsName;
          if (
            !(tag === "keywords" && !value.countKeywords) &&
            !(tag === "lastSentence" && !value.countWordsInLast)
          ) {
            cleanedTagsPatterns[file][tag] = {
              requirement:
                value.requirement &&
                value.requirement.replace(/<\/?strong>/gs, ""),
              quantity: value.quantity,
              content: value.content,
              forbiddenCharacters: value.forbiddenCharacters,
              keywordsIncluded:
                tag !== "keywords" ? value.keywordsIncluded : undefined,
              multipleTags: value.multipleTags,
            };
          }
        });
      });
      try {
        saveAnalyze(
          `./SEO/seo-analyze.json`,
          JSON.stringify(cleanedTagsPatterns, null, 2)
        );
        saveAnalyze(`./SEO/seo-analyze.html`, htmlWithTablesAndCharts);
      } catch {
        message("Failed to create files", "red");
        return;
      } finally {
        message(
          `Your website has been analyzed, JSON and html files have been generated in ./SEO`,
          "green"
        );
      }
      try {
        await open(path.join(process.cwd(), "./SEO", `seo-analyze.html`), {
          app: { name: apps.browser },
        });
      } catch {
        message("Cannot open browser. Please open file manually", "red");
        return;
      }
    }
  };
  return { analyze };
};
