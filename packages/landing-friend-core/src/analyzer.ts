import path from "path";
import open, { apps } from "open";
import {
  AdvancedTagsProps,
  ConfigFile,
  TagsProps,
  getFilesToAnalyze,
  matchedSetting,
  message,
  forbiddenCharacters as _forbiddenCharacters,
  checkFiles,
  prepareHTMLWithTables,
  CombinedPatterns,
  AllTagsName,
  saveAnalyze,
  CombineTagsWithReason,
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
    let combinedTagsPatternsArray: CombinedPatterns[] = [];

    allFiles.forEach((file) => {
      if (!matchedSetting(file, excludedPage, input)) {
        combinedTagsPatternsArray.push(
          checkFiles({
            file,
            tags,
            advancedTags,
            countKeywords: tags.keywords.count,
            countWordsInLast: tags.lastSentence.count,
          })
        );
      }
    });

    const htmlWithTablesAndCharts = prepareHTMLWithTables(
      combinedTagsPatternsArray
    );

    if (analyzer) {
      let cleanedTagsPatterns: CombinedPatterns = {};
      combinedTagsPatternsArray.forEach((combinedTagsPatterns) => {
        Object.entries(combinedTagsPatterns).forEach(([file, tagData]) => {
          let tagArray = {} as Record<AllTagsName, CombineTagsWithReason>;
          Object.entries(tagData).forEach(([_tag, _value]) => {
            const tag = _tag as AllTagsName;
            const value = _value as CombineTagsWithReason;
            if (
              !(tag === "keywords" && !value.countKeywords) &&
              !(tag === "lastSentence" && !value.countWordsInLast)
            ) {
              tagArray = {
                ...tagArray,
                [tag]: {
                  requirement:
                    value.requirement &&
                    value.requirement.replace(/<\/?strong>/gs, ""),
                  quantity: value.quantity,
                  content: value.content,
                  forbiddenCharacters: value.forbiddenCharacters,
                  keywordsIncluded:
                    tag !== "keywords" ? value.keywordsIncluded : undefined,
                  multipleTags: value.multipleTags,
                  tagAmount:
                    tag === "og" || tag === "twitter"
                      ? value.tagAmount
                      : undefined,
                  listOfFoundMeta: value.listOfFoundMeta,
                } as CombineTagsWithReason,
              } as Record<AllTagsName, CombineTagsWithReason>;
            }
          });
          cleanedTagsPatterns[file] = tagArray;
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
