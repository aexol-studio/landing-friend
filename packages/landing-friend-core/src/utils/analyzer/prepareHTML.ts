import {
  AllTagsName,
  CombineTagsWithReason,
  CombinedPatterns,
  TagsName,
  AdditionalTagsName,
  DataToMissingSection,
  TagsToMissingSection,
  generateMissingKeywordsSection,
  AdvancedTagsName,
  BasicTagsName,
  generateMainSection,
  generateMetaTagsSection,
} from "@/index.js";

interface DefaultGenerate {
  countKeywords: boolean;
  countWordsInLast: boolean;
  advancedAnalyzer: boolean;
  trailingSlash?: boolean;
  domain: string;
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
  trailingSlash,
  domain,
}: GenerateTable): string => {
  return Object.entries(combinedTagsPatterns)
    .map(([file, tagData]) => {
      let h1Keywords: string[] | undefined;

      if (TagsName.h1 in tagData) {
        h1Keywords = tagData.h1.keywordsIncluded;
      }

      const dataForMissingSection: DataToMissingSection = {
        description: { missingKeywords: [], toMuchKeywords: [] },
        h1: { missingKeywords: [], toMuchKeywords: [] },
        keywords: { missingKeywords: [], toMuchKeywords: [] },
        title: { missingKeywords: [], toMuchKeywords: [] },
        lastSentence: { missingKeywords: [], toMuchKeywords: [] },
      };

      Object.entries(tagData).forEach(([_tag, _value]) => {
        const tag = _tag as AllTagsName;
        const value = _value as CombineTagsWithReason;
        const { missingKeywords, toMuchKeywords } = value;

        if (tag in TagsName || (tag in AdditionalTagsName && tag !== "canonical")) {
          dataForMissingSection[tag as TagsToMissingSection] = {
            missingKeywords: missingKeywords ? missingKeywords : [],
            toMuchKeywords: toMuchKeywords ? toMuchKeywords : [],
          };
        }
      });

      const missingSection = generateMissingKeywordsSection({
        h1Keywords,
        data: dataForMissingSection,
      });

      const row = (missingSection: string) => {
        let mainSection: string = "";
        let metaTagSection: string = "";
        Object.entries(tagData)
          .map(([_tag, _value]) => {
            const tag = _tag as AllTagsName;
            const value = _value as CombineTagsWithReason;

            if (!(tag in AdvancedTagsName)) {
              mainSection += `<tr>${generateMainSection({
                countKeywords,
                countWordsInLast,
                tag: tag as BasicTagsName,
                value,
                trailingSlash,
                pathname: file,
                domain,
              })}</tr>`;
            } else {
              metaTagSection += advancedAnalyzer
                ? `<tr><td colspan="2" style="height:20px;"></td></tr>
           ${generateMetaTagsSection({ tag: tag as AdvancedTagsName, value })}`
                : "";
            }
          })
          .join("");
        return mainSection + missingSection + metaTagSection;
      };

      return `<thead>
          <tr>
          <th colspan="2"> 
          <span>${file}</span>
          <span class="toggle-button" id="toggle-button-${tableIndex}">▼</span>
          </th>
          </tr>
          </thead>
          <tbody id="toggle-body-${tableIndex}" class="hidden">
            ${row(missingSection)}    
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
  trailingSlash,
  domain,
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
        trailingSlash,
        domain,
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
