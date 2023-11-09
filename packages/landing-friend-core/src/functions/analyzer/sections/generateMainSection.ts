import { BasicTagsName, CombineTagsWithReason, additionalTagsName } from "@/index.js";
import { arrayFilleter } from "../arrayFillter.js";

interface Props {
  tag: BasicTagsName;
  value: CombineTagsWithReason;
  countKeywords: boolean;
  countWordsInLast: boolean;
  h1Keywords: string[];
  trailingSlash?: boolean;
  pathname: string;
  domain: string;
}

export const generateMainSection = ({
  tag,
  countKeywords,
  value,
  countWordsInLast,
  h1Keywords,
  trailingSlash,
  pathname: __pathname,
  domain,
}: Props) => {
  if (!countWordsInLast && tag === "lastSentence") return "";
  if (value.multipleTags) {
    return `<td><strong style="color: red">Warning! Number of multiple ${tag} on the page: ${value.quantity}</strong></td><td width="20%"><strong style="color: red">Check the code</strong></td>`;
  } else {
    const _pathname = __pathname.replace("index.html", "");
    const pathname = trailingSlash ? _pathname : _pathname.replace(new RegExp("\\$", "g"), "");
    const url = domain + pathname;

    const firstCell = `<td>
  ${tag === "keywords" ? "Length of " : "List of "}
  <strong>${tag === "lastSentence" ? "last sentence" : tag}</strong>: 
  ${
    value.minLength && value.maxLength
      ? `<strong style="color:${
          value.quantity >= value.minLength && value.quantity <= value.maxLength ? "black" : "red"
        }">${value.quantity}</strong>`
      : tag in additionalTagsName
      ? value.quantity > 0
        ? `<strong style="color: ${
            tag !== "canonical" ? "black" : value.content === url ? "black" : "red"
          }">
        ${value.content}
        </strong>
        `
        : "No words detected"
      : "No characters detected"
  }
 ${
   value.quantity > 0 && countKeywords && tag !== "keywords" && tag !== "canonical"
     ? value.keywordsIncluded && value.keywordsIncluded.length > 0
       ? ` | <strong style="color:green">Keywords included: ${value.keywordsIncluded}</strong>`
       : ' | <strong style="color:red">Does not contain keywords</strong>'
     : ""
 }
      ${
        value.forbiddenCharacters && value.forbiddenCharacters.length > 0
          ? `<strong style="color:red">&nbsp;(Contains forbidden words: ${value.forbiddenCharacters})</strong>`
          : ""
      }
  </td>`;

    //Second cell in row
    const secondCell = `<td width="20%">
${
  !value.requirement
    ? ""
    : value.minLength && value.maxLength
    ? `<span style="${
        value.quantity >= value.minLength && value.quantity <= value.maxLength
          ? "color: black"
          : "color: red"
      }">${value.requirement}</span>`
    : (value.keywordsIncluded &&
        arrayFilleter(value.keywordsIncluded, h1Keywords).length === 0 &&
        arrayFilleter(h1Keywords, value.keywordsIncluded).length === 0) ||
      value.content === url
    ? ""
    : `<strong style="color:red">${value.requirement}</strong>`
}
    </td>`;

    return `${firstCell}${secondCell}`;
  }
};
