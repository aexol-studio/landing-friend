import {
  AllTagsName,
  BasicTagsName,
  CombineTagsWithReason,
  CombinedPatterns,
  advancedTagsName,
} from "../../index.js";
import { generateMainSection } from "./sections/generateMainSection.js";
import { generateMetaTagsSection } from "./sections/generateMetaTagsSection.js";
import { generateMissingKeywordsSection } from "./sections/generateMissingKeywordsSection.js";

type KeywordsTagsProps = Record<string, string[]>;

interface DefaultGenerate {
  countKeywords: boolean;
  countWordsInLast: boolean;
  advancedAnalyzer: boolean;
}

type GenerateTable = DefaultGenerate & {
  combinedTagsPatterns: CombinedPatterns;
  tableIndex: number;
};
type PrepareHtml = DefaultGenerate & { combinedTagsPatterns: CombinedPatterns[] };

const generateTableRows = ({
  combinedTagsPatterns,
  countKeywords,
  countWordsInLast,
  advancedAnalyzer,
  tableIndex,
}: GenerateTable): string => {
  return Object.entries(combinedTagsPatterns)
    .map(([file, tagData]) => {
      const keywordsToTags: KeywordsTagsProps = {};
      Object.entries(tagData).forEach(([_tag, _value]) => {
        const tag = _tag as AllTagsName;
        const value = _value as CombineTagsWithReason;
        if (tag !== "keywords" && value.keywordsIncluded && countKeywords) {
          keywordsToTags[tag] = value.keywordsIncluded;
        }
      });

      const h1Keywords = keywordsToTags.h1 || [];
      const titleKeywords = keywordsToTags.title || [];
      const descriptionKeywords = keywordsToTags.description || [];
      const lastSentenceKeywords = keywordsToTags.lastSentence || [];

      const mainRow = Object.entries(tagData)
        .map(([_tag, _value]) => {
          const tag = _tag as AllTagsName;
          const value = _value as CombineTagsWithReason;

          if (!(tag in advancedTagsName)) {
            return `<tr>${generateMainSection({
              countKeywords,
              countWordsInLast,
              h1Keywords,
              tag: tag as BasicTagsName,
              value,
            })}</tr>`;
          }
        })
        .join("");

      const metaRow = Object.entries(tagData)
        .map(([_tag, _value]) => {
          if (!advancedAnalyzer) return;
          const tag = _tag as AllTagsName;
          const value = _value as CombineTagsWithReason;

          if (tag in advancedTagsName) {
            return generateMetaTagsSection({ tag: tag as advancedTagsName, value });
          }
        })
        .join("");

      return `<thead>
          <tr>
          <th colspan="2"> 
          <span>${file}</span>
          <span class="toggle-button" id="toggle-button-${tableIndex}">▼</span>
          </th>
          </tr>
          </thead>
          <tbody id="toggle-body-${tableIndex}" class="hidden">
          ${mainRow}
          ${
            countKeywords
              ? generateMissingKeywordsSection({
                  descriptionKeywords,
                  h1Keywords,
                  lastSentenceKeywords,
                  titleKeywords,
                })
              : ""
          }
        ${
          advancedAnalyzer
            ? `<tr><td colspan="2" style="height:20px;"></td></tr>
          ${metaRow}`
            : ""
        }
        </tbody>
        <tr class="empty-row"/>
         <script>
                document.addEventListener("DOMContentLoaded", () => {
                  const toggleButton = document.getElementById("toggle-button-${tableIndex}");
                  const toggleBody = document.getElementById("toggle-body-${tableIndex}");
                  toggleButton &&
                    toggleBody &&
                    toggleButton.addEventListener("click", () => {
                      if (toggleBody.classList.contains("hidden")) {
                        toggleBody.classList.remove("hidden");
                        toggleButton.textContent = "▲";
                      } else {
                        toggleBody.classList.add("hidden");
                        toggleButton.textContent = "▼";
                      }
                    });
                })
   </script>
          `;
    })
    .join("");
};

export const prepareHTMLWithTables = ({
  combinedTagsPatterns,
  countKeywords,
  countWordsInLast,
  advancedAnalyzer,
}: PrepareHtml): string => {
  let brokenTagsTable: string = "";
  combinedTagsPatterns.map((combinedTagsPattern, idx) => {
    brokenTagsTable =
      brokenTagsTable +
      generateTableRows({
        combinedTagsPatterns: combinedTagsPattern,
        countKeywords,
        countWordsInLast,
        advancedAnalyzer,
        tableIndex: idx,
      });
  });

  return `<!DOCTYPE html>
    <html>
      <head>
        <title>SEO analyze</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          .toggle-button {
            cursor: pointer;
          }
          .hidden {
            display: none;
          }
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
            justify-content: space-between;
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
