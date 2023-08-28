import {
  AllTagsName,
  CombineTagsWithReason,
  CombinedPatterns,
} from "../../index.js";

type KeywordsTagsProps = Record<string, string[]>;

const arrayFilleter = (firstArray: string[], secondArray: string[]) => {
  return firstArray.filter((element) => !secondArray.includes(element));
};

export const generateTableRows = ({
  combinedTagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  combinedTagsPatterns: CombinedPatterns;
  countKeywords: boolean;
  countWordsInLast: boolean;
}): string => {
  return Object.entries(combinedTagsPatterns)
    .map(([file, tagData]) => {
      let keywordsToTags: KeywordsTagsProps = {};
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

      const missingTitleKeywords = arrayFilleter(h1Keywords, titleKeywords);

      const missingDescriptionKeywords = arrayFilleter(
        h1Keywords,
        descriptionKeywords
      );

      const missingLastSentenceKeywords = arrayFilleter(
        h1Keywords,
        lastSentenceKeywords
      );

      const toMuchTitleKeywords = arrayFilleter(titleKeywords, h1Keywords);

      const toMuchDescriptionKeywords = arrayFilleter(
        descriptionKeywords,
        h1Keywords
      );

      const toMuchLastSentenceKeywords = arrayFilleter(
        lastSentenceKeywords,
        h1Keywords
      );

      const rows = Object.entries(tagData)
        .map(([_tag, _value]) => {
          const tag = _tag as AllTagsName;
          const value = _value as CombineTagsWithReason;

          return `
              <tbody>
          <tr>
              ${
                !(
                  (tag === "og" && value.listOfFoundMeta) ||
                  (tag === "twitter" && value.listOfFoundMeta)
                )
                  ? !(tag === "keywords" && !countKeywords)
                    ? !(tag === "lastSentence" && !countWordsInLast)
                      ? !isNaN(value.quantity)
                        ? value.maxLength && value.minLength
                          ? value.multipleTags
                            ? `<td><strong style="color: red">Warning! Number of multiple ${tag} on the page: ${value.quantity}</strong></td><td width="20%"><strong style="color: red">Check the code</strong></td>`
                            : `<td>Length of <strong>${tag}</strong>: <strong style="${
                                value.quantity >= value.minLength &&
                                value.quantity <= value.maxLength
                                  ? "color: black"
                                  : "color: red"
                              }">${value.quantity}</strong>${
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
                                value.quantity >= value.minLength &&
                                value.quantity <= value.maxLength
                                  ? "color: black"
                                  : "color: red"
                              }">${value.requirement}</span></td>`
                          : countWordsInLast && tag === "lastSentence"
                          ? `<td>List of <strong>${
                              tag === "lastSentence" &&
                              "Last sentence on website"
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
                            }</strong></td><td>
                          ${
                            value.keywordsIncluded &&
                            arrayFilleter(value.keywordsIncluded, h1Keywords)
                              .length === 0 &&
                            arrayFilleter(h1Keywords, value.keywordsIncluded)
                              .length === 0
                              ? `<span>${value.requirement}</span>`
                              : `<strong style="color:red">${value.requirement}</strong>`
                          }
                         </td>`
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
                  : `
                  <tr><td colspan="2"><strong>List of advanced meta tag <span style="color:green">${tag} (Number of tags: ${
                      value.tagAmount
                    })</span></strong> </td></tr>
                    ${Object.entries(value.listOfFoundMeta)
                      .map(([title, metaValue]) => {
                        return `<tr><td colspan="2">Content of <strong style="color:green">${title}</strong>: ${
                          metaValue?.content
                            ? metaValue.content
                            : `No content detected`
                        } 
                      ${
                        metaValue?.forbiddenCharacters
                          ? `<span style="color:red">${metaValue.forbiddenCharacters}</span>`
                          : ``
                      } 
                      </td></tr>`;
                      })
                      .join("")}
                  
                  `
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

export const prepareHTMLWithTables = ({
  combinedTagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  combinedTagsPatterns: CombinedPatterns[];
  countKeywords: boolean;
  countWordsInLast: boolean;
}): string => {
  let brokenTagsTable: string = "";

  combinedTagsPatterns.map((combinedTagsPattern) => {
    brokenTagsTable =
      brokenTagsTable +
      generateTableRows({
        combinedTagsPatterns: combinedTagsPattern,
        countKeywords,
        countWordsInLast,
      });
  });

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
