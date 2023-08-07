import path from "path";
import { ConfigFile, TagsProps } from "./config.js";
import { getFilesToAnalyze, readFile, saveFile } from "./utils.js";
import open, { apps } from "open";
import { message } from "./console.js";

type TagsPatterns = Record<string, Record<string, TagsWithReason>>;

type TagsRange = {
  minLength?: number;
  maxLength?: number;
  content?: string;
};
type TagsWithReason = TagsRange & {
  requirement: string;
  count: number;
  multipleTags?: boolean;
};

const staticTags = ["strong", "em", "span"];
const unicodeToConvert = {
  "&#x27;": "'",
  "&amp;": "&",
};

export const websiteAnalyzer = (config: ConfigFile) => {
  const { input, output, sitemap, analyzer } = config;
  if (!analyzer) {
    return {
      analyze: async () => message("Define analyzer in config", "redBright"),
    };
  }
  const tags = analyzer.tags;
  const analyze = async () => {
    const allFiles = getFilesToAnalyze(input);
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
          tagsPatterns,
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
          cleanedTagsPatterns[file][tag] = {
            ...value,
            requirement: value.requirement.replace(/<\/?strong>/g, ""),
          };
        });
      });

      saveFile(
        `${output}/seo-analyze.json`,
        JSON.stringify(cleanedTagsPatterns, null, 2)
      );

      saveFile(`${output}/seo-analyze.html`, await htmlWithTablesAndCharts);
      try {
        await open(path.join(process.cwd(), output, `seo-analyze.html`), {
          app: { name: apps.browser },
        });
      } catch {
        message("Cannot open browser. Please open file manually", "yellow");
        return;
      } finally {
        message(
          `Your website has been analyzed, JSON and html files have been generated in ${config.output}`,
          "green"
        );
      }
    }
  };
  return { analyze };
};

const checkFiles = ({
  file,
  tags,
  tagsPatterns,
}: {
  file: string;
  tags: TagsProps;
  tagsPatterns: TagsPatterns;
}) => {
  const fileContent = readFile(file);
  checkFileByPatterns({ file, fileContent, tags, tagsPatterns });
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
      if (matches.length > 1) {
        return (tagsPatterns[file] = {
          ...tagsPatterns[file],
          [tag]: {
            ...value,
            requirement: `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
            count: matches.length,
            multipleTags: true,
          },
        });
      } else {
        matches.forEach((match) => {
          let text: string;

          tag === "description"
            ? (text = match.replace(
                /<meta name="description" content="|\"$/g,
                ""
              ))
            : tag === "keywords"
            ? (text = match.replace(
                /<meta property="keywords" content="|\"$/g,
                ""
              ))
            : (text = match.replace(
                new RegExp(`^<${tag}.*?>|</${tag}>$`, "g"),
                ""
              ));

          staticTags.forEach((staticTag) => {
            Object.entries(unicodeToConvert).forEach(
              ([unicode, replacement]) => {
                const regex = new RegExp(
                  `<${staticTag}>|<\/${staticTag}>|${unicode}`,
                  "g"
                );
                text = text.replace(regex, replacement);
              }
            );
          });

          return (tagsPatterns[file] = {
            ...tagsPatterns[file],
            [tag]: {
              ...value,
              requirement:
                tag === "keywords"
                  ? ``
                  : `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
              count: text.length,
              content: text,
              multipleTags: false,
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
          multipleTags: false,
        },
      });
    }
  });
};

const generateTableRows = async (tagsPatterns: TagsPatterns) => {
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
                ? value.multipleTags
                  ? `<td><strong style="color: red">Warning! Number of ${tag} on the page: ${value.count}</strong></td><td width="20%"><strong style="color: red">Check the code</strong></td>`
                  : `<td>Length of <strong>${tag}</strong>: <strong style="${
                      value.count >= value.minLength &&
                      value.count <= value.maxLength
                        ? "color: black"
                        : "color: red"
                    }">${
                      value.count
                    }</strong></td><td width="20%"><strong style="${
                      value.count >= value.minLength &&
                      value.count <= value.maxLength
                        ? "color: black"
                        : "color: red"
                    }">${value.requirement}</strong></td>`
                : `<td>List of <strong>${tag}</strong>: <strong>${value.content}</strong></td><td></td>`
              : `<td>Length of <strong>${tag}</strong>: <strong style="color: red">No characters detected</strong></td><td width="20%"><strong style="color: red">${value.requirement}</strong></td>`
          }
      `;
        })
        .join("");

      return `<thead>
      <tr>
      <th colspan="2">${file
        .replace(`${process.cwd()}/out/`, "")
        .replace(".html", "")}</th>
      </tr>
      </thead>
      ${rows}
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
    <h1>Report</h1>
    <table>
      ${brokenTagsTable}
    </table>
  </body>
</html>`;
};
