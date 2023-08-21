import path from "path";
import { ConfigFile, TagsProps } from "./config.js";
import {
  getFilesToAnalyze,
  matchedSetting,
  readFile,
  saveAnalyze,
} from "./utils.js";
import open, { apps } from "open";
import { message } from "./console.js";

type TagsPatterns = Record<string, Record<string, TagsWithReason>>;

type TagsWithReason = {
  minLength?: number;
  maxLength?: number;
  countKeywords?: boolean;
  countWordsInLast?: boolean;
  content?: string;
  requirement?: string;
  count: number;
  multipleTags?: boolean;
  keywordsIncluded?: string[];
  forbiddenCharacters?: string[];
};

type KeywordsTagsProps = Record<string, string[]>;

const staticTags = [
  "strong",
  "em",
  "span",
  "br",
  "style",
  "p",
  "div",
  "svg",
  "a",
  "path",
];
const unicodeToConvert = {
  "&#x27;": "'",
  "&amp;": "&",
};
const charactersToChange = ["！", "｜", "：", "ı", "＆"];

export const websiteAnalyzer = (config: ConfigFile) => {
  const { input, analyzer, excludedPage } = config;
  if (!analyzer) {
    return {
      analyze: async () => message("Define analyzer in config", "redBright"),
    };
  }
  const tags: TagsProps = analyzer.tags;
  const analyze = async () => {
    const allFiles = getFilesToAnalyze(input);

    let tagsPatterns: TagsPatterns = {};
    let countKeywords: boolean = true;
    let countWordsInLast: boolean = true;
    if (
      Object.entries(analyzer.tags).some(
        ([tag, value]) => tag === "keywords" && value.countKeywords !== true
      )
    ) {
      countKeywords = false;
    }
    if (
      Object.entries(analyzer.tags).some(
        ([tag, value]) =>
          tag === "lastSentence" && value.countWordsInLast !== true
      )
    ) {
      countWordsInLast = false;
    }

    allFiles.forEach((file) => {
      if (!matchedSetting(file, excludedPage, input)) {
        checkFiles({
          file,
          tags,
          tagsPatterns,
          countKeywords,
          countWordsInLast,
        });
      }
    });

    const htmlWithTablesAndCharts = prepareHTMLWithTables({
      tagsPatterns,
    });

    if (analyzer) {
      const cleanedTagsPatterns: TagsPatterns = {};
      Object.entries(tagsPatterns).forEach(([file, tagData]) => {
        cleanedTagsPatterns[file] = {};
        Object.entries(tagData).forEach(([tag, value]) => {
          !(tag === "keywords" && !value.countKeywords) &&
          !(tag === "lastSentence" && !value.countWordsInLast)
            ? (cleanedTagsPatterns[file][tag] = {
                requirement:
                  value.requirement &&
                  value.requirement.replace(/<\/?strong>/gs, ""),
                count: value.count,
                content: value.content,
                forbiddenCharacters: value.forbiddenCharacters,
                keywordsIncluded:
                  tag !== "keywords" ? value.keywordsIncluded : undefined,
                countKeywords:
                  tag === "keywords" ? value.countKeywords : undefined,
                countWordsInLast:
                  tag === "lastSentence" ? value.countWordsInLast : undefined,
              })
            : undefined;
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

const checkFiles = ({
  file,
  tags,
  tagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  tags: TagsProps;
  tagsPatterns: TagsPatterns;
  countKeywords: boolean;
  countWordsInLast: boolean;
}) => {
  const fileContent = readFile(file);
  checkFileByPatterns({
    file,
    fileContent,
    tags,
    tagsPatterns,
    countKeywords,
    countWordsInLast,
  });
};

const checkFileByPatterns = ({
  file,
  fileContent: _fileContent,
  tags,
  tagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  fileContent: string;
  tags: TagsProps;
  tagsPatterns: TagsPatterns;
  countKeywords: boolean;
  countWordsInLast: boolean;
}) => {
  Object.entries(tags).forEach(([tag, value]) => {
    let fileContent = _fileContent.replace(/\n\s*/g, " ");

    let regex: RegExp;
    let keywordsArray: string[] | undefined = [];
    if (countKeywords) {
      const keywordsMatch = fileContent.match(
        new RegExp(`<meta property="keywords" content="(.*?)"`, "gs")
      );

      if (keywordsMatch && keywordsMatch.length > 0) {
        const contentMatch = keywordsMatch[0].match(/content="(.*?)"/);

        if (contentMatch && contentMatch[1]) {
          const keywords = contentMatch[1].split(", ");
          keywords.forEach((keyword) => {
            keywordsArray && keywordsArray.push(keyword.trim());
          });
        }
      } else keywordsArray = undefined;
    } else keywordsArray = undefined;

    if (tag === "description") {
      regex = new RegExp(`<meta name="description" content="(.*?)"`, "gs");
    } else if (
      typeof value === "object" &&
      "countKeywords" in value &&
      value.countKeywords &&
      tag === "keywords"
    ) {
      regex = new RegExp(`<meta property="keywords" content="(.*?)"`, "gs");
    } else if (
      typeof value === "object" &&
      "countWordsInLast" in value &&
      value.countWordsInLast &&
      tag === "lastSentence"
    ) {
      regex = new RegExp(`<div.*?>(.*?)<\/div>`, "gs");
    } else {
      regex = new RegExp(`<${tag}.*?>(.*?)</${tag}>`, "gs");
    }

    let matches = fileContent.match(regex);
    if (tag === "lastSentence" && matches) {
      matches = [matches[matches.length - 1]];
    }

    if (matches) {
      if (matches.length > 1) {
        return (tagsPatterns[file] = {
          ...tagsPatterns[file],
          [tag]: {
            ...value,
            requirement: `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
            count: matches.length,
            multipleTags: true,
            countKeywords,
            countWordsInLast,
          },
        });
      } else {
        matches.forEach((match) => {
          let text: string;

          if (tag === "description") {
            text = match.replace(
              /<meta name="description" content="|\"$/gs,
              ""
            );
          } else if (
            typeof value === "object" &&
            "countKeywords" in value &&
            value.countKeywords &&
            tag === "keywords"
          ) {
            text = match.replace(
              /<meta property="keywords" content="|\"$/gs,
              ""
            );
          } else if (
            typeof value === "object" &&
            "countWordsInLast" in value &&
            value.countWordsInLast &&
            tag === "lastSentence"
          ) {
            text = match.replace(new RegExp(`^<div.*?>|</div>$`, "gs"), "");
          } else {
            text = match.replace(
              new RegExp(`^<${tag}.*?>|</${tag}>$`, "gs"),
              ""
            );
          }

          staticTags.forEach((staticTag) => {
            const staticTagRegex = new RegExp(
              `<${staticTag}.*?>|<\/${staticTag}>`,
              "gs"
            );
            Object.entries(unicodeToConvert).forEach(
              ([unicode, replacement]) => {
                const unicodeRegex = new RegExp(`${unicode}`, "gs");
                text = text.replace(unicodeRegex, replacement);
              }
            );

            text = text.replace(staticTagRegex, "");
          });

          const forbiddenCharacters = charactersToChange.filter((char) =>
            text.includes(char)
          );

          return (tagsPatterns[file] = {
            ...tagsPatterns[file],
            [tag]: {
              ...value,
              maxLength: tag !== "keywords" ? value.maxLength : undefined,
              minLength: tag !== "keywords" ? value.minLength : undefined,
              requirement:
                tag === "keywords"
                  ? undefined
                  : `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
              count: text.length,
              content: text,
              multipleTags: undefined,
              keywordsIncluded:
                tag !== "keywords" || countKeywords
                  ? keywordsArray &&
                    keywordsArray.filter((keyword) =>
                      text.toLowerCase().includes(keyword.toLowerCase())
                    )
                  : undefined,
              forbiddenCharacters:
                forbiddenCharacters.length > 0
                  ? forbiddenCharacters
                  : undefined,
              countKeywords,
              countWordsInLast,
            },
          });
        });
      }
    } else {
      return (tagsPatterns[file] = {
        ...tagsPatterns[file],
        [tag]: {
          ...value,
          requirement:
            tag === "keywords"
              ? `At least one keyword required`
              : `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
          count: NaN,
          countKeywords,
          countWordsInLast,
        },
      });
    }
  });
};

const generateTableRows = (tagsPatterns: TagsPatterns) => {
  return Object.entries(tagsPatterns)
    .map(([file, tagData]) => {
      let keywordsToTags: KeywordsTagsProps = {};
      Object.entries(tagData).forEach(([tag, value]) => {
        if (
          tag !== "keywords" &&
          value.keywordsIncluded &&
          tagData["keywords"].countKeywords
        ) {
          keywordsToTags[tag] = value.keywordsIncluded;
        }
      });

      const h1Keywords = keywordsToTags.h1 || [];
      const titleKeywords = keywordsToTags.title || [];
      const descriptionKeywords = keywordsToTags.description || [];
      const lastSentence = keywordsToTags.lastSentence || [];

      const missingTitleKeywords = h1Keywords.filter(
        (keyword) => !titleKeywords.includes(keyword)
      );

      const missingDescriptionKeywords = h1Keywords.filter(
        (keyword) => !descriptionKeywords.includes(keyword)
      );

      const missingLastSentenceKeywords = h1Keywords.filter(
        (keyword) => !lastSentence.includes(keyword)
      );

      const toMuchTitleKeywords = titleKeywords.filter(
        (keyword) => !h1Keywords.includes(keyword)
      );

      const toMuchDescriptionKeywords = descriptionKeywords.filter(
        (keyword) => !h1Keywords.includes(keyword)
      );
      const toMuchLastSentenceKeywords = lastSentence.filter(
        (keyword) => !h1Keywords.includes(keyword)
      );

      const rows = Object.entries(tagData)
        .map(([tag, value]) => {
          return `
          <tbody>
      <tr>
          ${
            !(tag === "keywords" && !value.countKeywords)
              ? !(tag === "lastSentence" && !value.countWordsInLast)
                ? !isNaN(value.count)
                  ? value.maxLength && value.minLength
                    ? value.multipleTags
                      ? `<td><strong style="color: red">Warning! Number of ${tag} on the page: ${value.count}</strong></td><td width="20%"><strong style="color: red">Check the code</strong></td>`
                      : `<td>Length of <strong>${tag}</strong>: <strong style="${
                          value.count >= value.minLength &&
                          value.count <= value.maxLength
                            ? "color: black"
                            : "color: red"
                        }">${value.count}</strong>${
                          value.forbiddenCharacters &&
                          value.forbiddenCharacters.length > 0
                            ? `<strong style="color:red">&nbsp;(Contains forbidden words: ${value.forbiddenCharacters})</strong>`
                            : ``
                        }${
                          value.keywordsIncluded
                            ? value.keywordsIncluded.length > 0
                              ? ` | <strong style="color:green">Keywords included: ${value.keywordsIncluded}</strong>`
                              : ` | <strong style="color:red">Does not contain keywords</strong>`
                            : ``
                        }</td><td width="20%"><span style="${
                          value.count >= value.minLength &&
                          value.count <= value.maxLength
                            ? "color: black"
                            : "color: red"
                        }">${value.requirement}</span></td>`
                    : value.countWordsInLast && tag === "lastSentence"
                    ? `<td>List of <strong>${
                        tag === "lastSentence" && "Last sentence on website"
                      }</strong>: ${
                        value.forbiddenCharacters &&
                        value.forbiddenCharacters.length > 0
                          ? `<strong style="color:red">&nbsp;(Contains forbidden words: ${value.forbiddenCharacters})</strong>`
                          : ``
                      }${
                        value.keywordsIncluded
                          ? value.keywordsIncluded.length > 0
                            ? ` | <strong style="color:green">Keywords included: ${value.keywordsIncluded}</strong>`
                            : ` | <strong style="color:red">Does not contain keywords</strong>`
                          : ``
                      }</strong></td><td></td>`
                    : `<td>List of <strong>${tag}</strong>: <strong>${value.content}</strong></td><td></td>`
                  : `<td>${
                      tag !== "keywords" ? `Length of ` : `List of `
                    }<strong>${tag}</strong>: <strong style="color: red">${
                      tag !== "keywords"
                        ? `No characters detected`
                        : `No words detected`
                    }</strong></td><td width="20%"><strong style="color: red">${
                      value.requirement
                    }</strong></td>`
                : ``
              : ``
          }
          </tr>
          `;
        })
        .join("");

      const generateKeywordsSections = () => {
        let sections = "";

        const missingKeywordsHeader = `
            <tr><td colspan="2"><strong style="color:red">Missing keywords: </strong></td></tr>
          `;

        const tooMuchKeywordsHeader = `
            <tr><td colspan="2"><strong style="color:red">Too much keywords: </strong></td></tr>
          `;

        const generateMissingKeywordsSection = (
          tag: string,
          keywordsList: string[]
        ) => {
          if (keywordsList.length > 0) {
            return `
                <tr><td colspan="2"><strong>${tag}</strong> : ${keywordsList}</td></tr>
              `;
          }
          return "";
        };

        const generateTooMuchKeywordsSection = (
          tag: string,
          keywordsList: string[]
        ) => {
          if (keywordsList.length > 0) {
            return `
                <tr><td colspan="2"><strong>${tag}</strong> : ${keywordsList}</td></tr>
              `;
          }
          return "";
        };

        if (
          missingTitleKeywords.length > 0 ||
          missingDescriptionKeywords.length > 0 ||
          missingLastSentenceKeywords.length > 0
        ) {
          sections += missingKeywordsHeader;
          sections += generateMissingKeywordsSection(
            "Title",
            missingTitleKeywords
          );
          sections += generateMissingKeywordsSection(
            "Description",
            missingDescriptionKeywords
          );
          sections += generateMissingKeywordsSection(
            "Last Sentence",
            missingLastSentenceKeywords
          );
        }

        if (
          toMuchTitleKeywords.length > 0 ||
          toMuchDescriptionKeywords.length > 0 ||
          toMuchLastSentenceKeywords.length > 0
        ) {
          sections += tooMuchKeywordsHeader;
          sections += generateTooMuchKeywordsSection(
            "Title",
            toMuchTitleKeywords
          );
          sections += generateTooMuchKeywordsSection(
            "Description",
            toMuchDescriptionKeywords
          );
          sections += generateTooMuchKeywordsSection(
            "Last Sentence",
            toMuchLastSentenceKeywords
          );
        }

        return sections;
      };

      return `<thead>
      <tr>
      <th colspan="2">${file}</th>
      </tr>
      </thead>
      <tbody>
      ${rows}
      ${generateKeywordsSections()}
      </tbody>
     <tr class="empty-row"></tr>
      `;
    })
    .join("");
};

const prepareHTMLWithTables = (data: { tagsPatterns: TagsPatterns }) => {
  const { tagsPatterns } = data;
  const brokenTagsTable = generateTableRows(tagsPatterns);

  return `<!DOCTYPE html>
<html>
  <head>
    <title>SEO analyze</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        background-color: #f9f9f9;
      }
      h1 {
        margin-bottom: 20px;
      }
      h4 {
        word-break: break-word;
        margin-bottom: 12px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        animation: fadeIn 0.5s ease-in-out;
        }
      th, 
      td {
        border: 1px solid black;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
      tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      .center {
        text-align: center;
      }
      .tag-container {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.5s ease-in-out;
        max-width: 420px;
        min-width: 420px;
      }
      .tag-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        word-break: break-word;
      }
      .tag-label {
        font-weight: bold;
        margin-right: 8px;
        flex: 1;
        overflow-wrap: break-word;
      }
      .tag-value {
        font-weight: bold;
        font-size: 16px;
        flex: 1;
        overflow-wrap: break-word;
        display: flex;
        justify-content: flex-end;
      }
      .empty-row {
        border: none;
        height: 40px;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .tag-container:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    </style>
  </head>
  <body>
    <h1>Report</h1>
    <table>
      ${brokenTagsTable}
    </table>
  </body>
</html>`;
};
