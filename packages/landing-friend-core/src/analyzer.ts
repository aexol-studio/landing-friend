import path from "path";
import { ConfigFile } from "./config.js";
import { getFilesToAnalyze, readFile, saveFile } from "./utils.js";
import open, { apps } from "open";
import { message } from "./console.js";

type TagsProps = Record<string, TagsRange>;
type TagsStatusProps = Record<string, Record<string, TagsStatus>>;
type TagsPatterns = Record<string, Record<string, TagsWithReason>>;

type TagsStatus = {
  h1: boolean;
  title: boolean;
  description: boolean;
  keywords: boolean;
};
type TagsRange = {
  minLength?: number;
  maxLength?: number;
  keywords?: string;
};
type TagsWithReason = TagsRange & { reason: string; count: number };

const staticTags = ["strong", "em", "span"];

export const websiteAnalyzer = (config: ConfigFile) => {
  const { input, output, sitemap, analyzer } = config;
  const tags = analyzer?.tags || {};
  const analyze = async () => {
    const allFiles = getFilesToAnalyze(input);
    let tagsStatus: TagsStatusProps = {};
    let tagsPatterns: TagsPatterns = {};

    const settingPerWildcard = Object.entries(
      sitemap?.settingsPerWildcard || {}
    ).map(([pagePattern, settings]) => ({
      pagePattern,
      ...settings,
    }));

    allFiles.forEach((file) => {
      const matchedSetting = settingPerWildcard.find((setting) => {
        const regexPattern = setting.pagePattern
          .replace(/\/$/g, ".html$")
          .replace(/^\//g, `^\/`)
          .replace("*/", "/")
          .replace("/*", "/");

        return file.match(new RegExp(regexPattern, "g"));
      });

      if (!matchedSetting) {
        checkFiles({
          file,
          tags,
          tagsStatus,
          tagsPatterns,
        });
      }
    });

    const htmlWithTablesAndCharts = prepareHTMLWithTables({
      tagsStatus,
      tagsPatterns,
    });

    if (analyzer?.saveAs === "json") {
      const JSONData = { tagsStatus, tagsPatterns };
      saveFile(`${output}/seo-analyze.json`, JSON.stringify(JSONData, null, 2));
    } else {
      saveFile(`${output}/seo-analyze.html`, htmlWithTablesAndCharts);
      try {
        await open(path.join(process.cwd(), output, `seo-analyze.html`), {
          app: { name: apps.browser },
        });
      } catch {
        message("Cannot open browser. Please open file manually", "yellow");
        return;
      }
    }
  };
  return { analyze };
};

const checkFiles = ({
  file,
  tags,
  tagsStatus,
  tagsPatterns,
}: {
  file: string;
  tags: TagsProps;
  tagsStatus: TagsStatusProps;
  tagsPatterns: TagsPatterns;
}) => {
  const fileContent = readFile(file);
  checkTagsStatus({ file, fileContent, tags, tagsStatus });
  checkFileByPatterns({ file, fileContent, tags, tagsPatterns });
};

const checkTagsStatus = ({
  file,
  fileContent,
  tags,
  tagsStatus,
}: {
  file: string;
  fileContent: string;
  tags: TagsProps;
  tagsStatus: TagsStatusProps;
}) => {
  Object.entries(tags).forEach(([tag]) => {
    const regex = new RegExp(`<${tag}.*?>(.*?)</${tag}>`, "g");
    const matches = fileContent.match(regex);
    return Object.assign(tagsStatus, {
      [file]: {
        ...tagsStatus[file],
        [tag]: !!matches,
      },
    });
  });
};

const checkFileByPatterns = ({
  file,
  fileContent,
  tags,
  tagsPatterns,
}: {
  file: string;
  fileContent: string;
  tags: TagsProps;
  tagsPatterns: TagsPatterns;
}) => {
  Object.entries(tags).forEach(([tag, value]) => {
    let regex: RegExp;

    tag === "description"
      ? (regex = new RegExp(`<meta name="description" content="(.*?)"`, "g"))
      : tag === "keywords"
      ? (regex = new RegExp(`<meta property="keywords" content="(.*?)"`, "g"))
      : (regex = new RegExp(`<${tag}.*?>(.*?)</${tag}>`, "g"));

    const matches = fileContent.match(regex);
    if (matches) {
      matches.forEach((match) => {
        let text: string;

        tag === "description"
          ? (text = match
              .replace(/<meta name="description" content="/g, "")
              .replace(/\"$/g, ""))
          : tag === "keywords"
          ? (text = match
              .replace(/<meta property="keywords" content="/g, "")
              .replace(/\"$/g, ""))
          : (text = match
              .replace(new RegExp(`^<${tag}.*?>`, "g"), "")
              .replace(new RegExp(`</${tag}>$`, "g"), ""));

        staticTags.forEach((staticTag) => {
          const regex = new RegExp(`<${staticTag}>|<\/${staticTag}>`, "g");
          text = text.replace(regex, "");
        });

        return (tagsPatterns[file] = {
          ...tagsPatterns[file],
          [tag]: {
            ...value,
            reason: `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
            count: text.length,
            keywords: text,
          },
        });
      });
    } else {
      return (tagsPatterns[file] = {
        ...tagsPatterns[file],
        [tag]: {
          ...value,
          reason: `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
          count: NaN,
        },
      });
    }
  });
};

const generateTableRows = (tagsPatterns: TagsPatterns) => {
  return Object.entries(tagsPatterns)
    .map(([file, tagData]) => {
      const rows = Object.entries(tagData)
        .map(([tag, value]) => {
          return `
          <tbody>
          <tr>
          ${
            !isNaN(value.count)
              ? value.maxLength && value.minLength
                ? `<td>Length of <strong>${tag}</strong>: <strong style="${
                    value.minLength <= value.count &&
                    value.count >= value.maxLength
                      ? "color: red"
                      : "color: black"
                  }">${value.count}</strong></td>`
                : `<td>List of <strong>${tag}</strong>: <strong>${value.keywords}</strong></td>`
              : `<td>Length of <strong>${tag}</strong>: <strong style="color: red">No characters detected</strong></td>`
          }
        ${
          tag !== "keywords"
            ? `  <td width="20%">${value.reason}</td>`
            : ` <td width="20%"></td>`
        }
          </tr>
          </tbody>
      `;
        })
        .join("");
      return `<thead>
      <tr>
      <th colspan="2">${file}</th>
      </tr>
      </thead>
      ${rows}
     <tr class="empty-row"></tr>
      `;
    })
    .join("");
};

const generateWithoutTagsTable = (tagsStatus: TagsStatusProps) => {
  return Object.entries(tagsStatus)
    .map(([file, tags]) => {
      return `<div class="tag-container">
          <h4>${file}</h4>
          <div class="tag-row">
            <div class="tag-label">h1:</div>
            <div class="tag-value">${tags.h1 ? "✅" : "❌"}</div>
          </div>
          <div class="tag-row">
            <div class="tag-label">title:</div>
            <div class="tag-value">${tags.title ? "✅" : "❌"}</div>
          </div>
          <div class="tag-row">
            <div class="tag-label">description:</div>
            <div class="tag-value">${tags.description ? "✅" : "❌"}</div>
          </div>
        </div>`;
    })
    .join("");
};

const prepareHTMLWithTables = (data: {
  tagsPatterns: TagsPatterns;
  tagsStatus: TagsStatusProps;
}) => {
  const { tagsPatterns, tagsStatus } = data;
  const brokenTagsTable = generateTableRows(tagsPatterns);
  const withoutTagsTable = generateWithoutTagsTable(tagsStatus);

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
      .flex-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 20px;
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
    <h1>Tags Range</h1>
    <table>
      ${brokenTagsTable}
    </table>
    <h1>Without tags</h1>
    <div class="flex-container">
      ${withoutTagsTable}
    </div>
  </body>
</html>`;
};
