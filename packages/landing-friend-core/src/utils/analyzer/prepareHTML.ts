import {
  AdditionalTagsName,
  AdvancedTagsName,
  AllTagsName,
  BasicTagsName,
  CombinedPatterns,
  CombineTagsWithReason,
  DataToMissingSection,
  generateMainSection,
  generateMetaTagsSection,
  generateMissingKeywordsSection,
  TagsName,
  TagsToMissingSection,
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
}: GenerateTable): { numberOfErrors: number; row: string } => {
  let numberOfErrors = 0;
  const row = Object.entries(combinedTagsPatterns)
    .map(([file, tagData]) => {
      let h1Keywords: string[] | undefined;
      let mainKeywords: string[] | undefined;

      if (TagsName.H1 in tagData) {
        h1Keywords = tagData.h1.keywordsIncluded;
      }
      if (AdditionalTagsName.Keywords in tagData) {
        mainKeywords = tagData.keywords.keywordsIncluded;
      }

      const dataForMissingSection: DataToMissingSection = {
        description: { missingKeywords: [], toMuchKeywords: [] },
        h1: { missingKeywords: [], toMuchKeywords: [] },
        title: { missingKeywords: [], toMuchKeywords: [] },
        lastSentence: { missingKeywords: [], toMuchKeywords: [] },
      };

      Object.entries(tagData).forEach(([_tag, _value]) => {
        const tag = _tag as AllTagsName;
        const value = _value as CombineTagsWithReason;
        const { missingKeywords, toMuchKeywords, isError } = value;

        if (isError) {
          numberOfErrors++;
        }

        if (
          Object.values(TagsName).includes(tag as TagsName) ||
          (Object.values(AdditionalTagsName).includes(tag as AdditionalTagsName) &&
            tag !== "canonical")
        ) {
          dataForMissingSection[tag as TagsToMissingSection] = {
            missingKeywords: missingKeywords ? missingKeywords : [],
            toMuchKeywords: toMuchKeywords ? toMuchKeywords : [],
          };
        }
      });

      const missingSection = generateMissingKeywordsSection({
        h1Keywords,
        data: dataForMissingSection,
        countKeywords,
        mainKeywords,
      });

      const row = (missingSection: string) => {
        let mainSection: string = "";
        let metaTagSection: string = "";
        Object.entries(tagData)
          .map(([_tag, _value]) => {
            const tag = _tag as AllTagsName;
            const value = _value as CombineTagsWithReason;

            if (!Object.values(AdvancedTagsName).includes(tag as AdvancedTagsName)) {
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

      return `
      <table>
    <thead>
        <tr>
            <th colspan="2">
                ${file} | ${numberOfErrors > 0 ? `Number of errors: (${numberOfErrors})` : ""}
                <span class="toggle-button" id="toggle-button-${tableIndex}">▼</span>
            </th>
        </tr>
    </thead>
    <tbody id="toggle-body-${tableIndex}" class="hidden">
        ${row(missingSection)}
    </tbody>
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
</table>
  `;
    })
    .join("");
  return { row, numberOfErrors };
};

export const prepareHTMLWithTables = ({
  combinedTagsPatterns,
  countKeywords,
  countWordsInLast,
  advancedAnalyzer,
  trailingSlash,
  domain,
}: PrepareHtml): string => {
  const brokenTagsTable: { row: string; numberOfErrors: number }[] = [];
  const correctTagsTable: { row: string; numberOfErrors: number }[] = [];
  combinedTagsPatterns.map((combinedTagsPattern, idx) => {
    const { numberOfErrors, row } = generateTableRows({
      combinedTagsPatterns: combinedTagsPattern,
      countKeywords,
      countWordsInLast,
      advancedAnalyzer,
      tableIndex: idx,
      trailingSlash,
      domain,
    });
    if (numberOfErrors === 0) {
      correctTagsTable.push({ numberOfErrors, row });
    } else {
      brokenTagsTable.push({ numberOfErrors, row });
    }
  });

  const brokenTags = brokenTagsTable
    .sort((a, b) => a.numberOfErrors - b.numberOfErrors)
    .map(tagTable => tagTable.row)
    .join("");

  const correctTags = correctTagsTable.map(tagTable => tagTable.row).join("");

  return `
  <!DOCTYPE html>
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
              margin: 30px 0px 60px;
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
  
          .toggle-button {
              cursor: pointer;
          }
  
          .hidden {
              display: none;
          }
      </style>
  </head>
  
  <body>
      <h1>Report for ${domain}</h1>
      <table>
          ${
            correctTagsTable.length > 0
              ? `
          <thead>
              <tr>
                  <th colspan="2">Correct Tags (${correctTagsTable.length}) <span class="toggle-button"
                          id="toggle-button-correct">▼</span></th>
              </tr>
          </thead>
          <td id="toggle-body-correct" style="padding:0px 12px">
              ${correctTags}
          </td>
          `
              : ""
          }
      </table>
      <table>
          <tr>
              <th colspan="2">Broken Tags (${
                brokenTagsTable.length
              }) <span class="toggle-button" id="toggle-button-broken">▼</span></th>
          </tr>
          <td id="toggle-body-broken" style="padding:0px 12px">
              ${brokenTags}
          </td>
      </table>
  </body>
  <script>
      document.addEventListener("DOMContentLoaded", () => {
          const toggleButtonCorrect = document.getElementById("toggle-button-correct");
          const toggleBodyCorrect = document.getElementById("toggle-body-correct");
          const toggleButtonBroken = document.getElementById("toggle-button-broken");
          const toggleBodyBroken = document.getElementById("toggle-body-broken");
          toggleButtonCorrect &&
              toggleBodyCorrect &&
              toggleButtonCorrect.addEventListener("click", () => {
                  if (toggleBodyCorrect.classList.contains("hidden")) {
                      toggleBodyCorrect.classList.remove("hidden");
                      toggleButtonCorrect.textContent = "▲";
                  } else {
                      toggleBodyCorrect.classList.add("hidden");
                      toggleButtonCorrect.textContent = "▼";
                  }
              });
          toggleButtonBroken &&
              toggleBodyBroken &&
              toggleButtonBroken.addEventListener("click", () => {
                  if (toggleBodyBroken.classList.contains("hidden")) {
                      toggleBodyBroken.classList.remove("hidden");
                      toggleButtonBroken.textContent = "▲";
                  } else {
                      toggleBodyBroken.classList.add("hidden");
                      toggleButtonBroken.textContent = "▼";
                  }
              });
      })
  </script>
  
  </html>
  `;
};
