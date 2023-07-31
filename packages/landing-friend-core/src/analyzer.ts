import path from "path";
import { ConfigFile } from "./config.js";
import { getFilesToAnalyze, readFile, saveFile } from "./utils.js";
import open, { apps } from "open";
import { message } from "./console.js";

type TagsStatus = { h1: boolean; title: boolean; description: boolean };
type Tags = { minLength: number; maxLength: number };
type TagsWithReason = Tags & { reason: string };

export const websiteAnalyzer = (config: ConfigFile) => {
  const { input, output } = config;
  const tags = config.analyzer?.tags || {};
  const analyze = async () => {
    const allFiles = getFilesToAnalyze(input);
    let tagsStatus: Record<string, Record<string, TagsStatus>> = {};
    let tagsPatterns: Record<string, Record<string, TagsWithReason>> = {};

    allFiles.forEach((file) => {
      checkFiles({
        file,
        tags,
        tagsStatus,
        tagsPatterns,
      });
    });

    const htmlWithTablesAndCharts = prepareHTMLWithTables({
      tagsStatus,
      tagsPatterns,
    });

    if (config.analyzer?.saveAs === "json") {
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
  tags: Record<string, Tags>;
  tagsStatus: Record<string, Record<string, TagsStatus>>;
  tagsPatterns: Record<string, Record<string, TagsWithReason>>;
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
  tags: Record<string, Tags>;
  tagsStatus: Record<string, Record<string, TagsStatus>>;
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
  tags: Record<string, Tags>;
  tagsPatterns: Record<string, Record<string, TagsWithReason>>;
}) => {
  Object.entries(tags).forEach(([tag, value]) => {
    const regex = new RegExp(`<${tag}.*?>(.*?)</${tag}>`, "g");
    const matches = fileContent.match(regex);
    if (matches) {
      matches.forEach((match) => {
        const tagLength = match.replace(`<${tag}>`, "").length;
        const textLength = match
          .replace(`<${tag}>`, "")
          .replace(`</${tag}>`, "").length;
        if (tagLength < value.minLength || tagLength > value.maxLength) {
          tagsPatterns[file] = {
            ...tagsPatterns[file],
            [tag]: {
              ...value,
              reason: `Tag length is <strong>${textLength}</strong> but should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
            },
          };
        }
        if (textLength < value.minLength || textLength > value.maxLength) {
          tagsPatterns[file] = {
            ...tagsPatterns[file],
            [tag]: {
              ...value,
              reason: `Text length is <strong>${textLength}</strong> but should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
            },
          };
        }
      });
    }
  });
};

const generateTableRows = (
  tagsPatterns: Record<string, Record<string, TagsWithReason>>
) => {
  return Object.entries(tagsPatterns)
    .map(([file, tagData]) => {
      const rows = Object.entries(tagData)
        .map(([tag, value]) => {
          return `
      <tr>
        <td>${tag}:</td>
        <td>${value.reason}</td>
      </tr>`;
        })
        .join("");
      return `<tr>
        <td>${file}</td>
      </tr>${rows}`;
    })
    .join("");
};

const generateWithoutTagsTable = (
  tagsStatus: Record<string, Record<string, TagsStatus>>
) => {
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
  tagsPatterns: Record<string, Record<string, TagsWithReason>>;
  tagsStatus: Record<string, Record<string, TagsStatus>>;
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
        margin-bottom: 10px;
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
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        animation: fadeIn 0.5s ease-in-out;
        }
      th, td {
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
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    <h1>Broken tags</h1>
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
