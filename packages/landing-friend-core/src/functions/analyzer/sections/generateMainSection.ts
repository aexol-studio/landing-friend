import { BasicTagsName, CombineTagsWithReason } from "@/index.js";
import { arrayFilleter } from "../arrayFillter.js";

interface Props {
  tag: BasicTagsName;
  value: CombineTagsWithReason;
  countKeywords: boolean;
  countWordsInLast: boolean;
  h1Keywords: string[];
}

interface TextToDisplay {
  tag: BasicTagsName;
  quantity: number;
  minLength: number | undefined;
  maxLength: number | undefined;
  forbiddenCharacters: string[] | undefined;
  keywordsIncluded: string[] | undefined;
  requirement: string | undefined;
  h1Keywords: string[];
  content: string | undefined;
  countKeywords: boolean;
}

const textToDisplay = ({
  tag,
  quantity,
  minLength,
  maxLength,
  forbiddenCharacters,
  keywordsIncluded,
  requirement,
  h1Keywords,
  content,
  countKeywords,
}: TextToDisplay) => {
  //First cell in row
  const firstCell = `<td>
  ${tag === "keywords" ? "Length of " : "List of "}
  <strong>${tag}</strong>: 
  ${
    minLength && maxLength
      ? `<strong style="${
          quantity >= minLength && quantity <= maxLength ? "color: black" : "color: red"
        }">${quantity}</strong>`
      : tag === "keywords" || tag === "lastSentence"
      ? quantity > 0
        ? `${content}`
        : "No words detected"
      : "No characters detected"
  }
 ${
   quantity > 0 && countKeywords && tag !== "keywords"
     ? keywordsIncluded && keywordsIncluded.length > 0
       ? ` | <strong style="color:green">Keywords included: ${keywordsIncluded}</strong>`
       : ' | <strong style="color:red">Does not contain keywords</strong>'
     : ""
 }
      ${
        forbiddenCharacters && forbiddenCharacters.length > 0
          ? `<strong style="color:red">&nbsp;(Contains forbidden words: ${forbiddenCharacters})</strong>`
          : ""
      }
  </td>`;

  //Second cell in row
  const secondCell = `<td width="20%">
${
  !requirement
    ? ""
    : minLength && maxLength
    ? `<span style="${
        quantity >= minLength && quantity <= maxLength ? "color: black" : "color: red"
      }">${requirement}</span>`
    : keywordsIncluded &&
      arrayFilleter(keywordsIncluded, h1Keywords).length === 0 &&
      arrayFilleter(h1Keywords, keywordsIncluded).length === 0
    ? ""
    : `<strong style="color:red">${requirement}</strong>`
}
    </td>`;

  return `${firstCell}${secondCell}`;
};

export const generateMainSection = ({
  tag,
  countKeywords,
  value,
  countWordsInLast,
  h1Keywords,
}: Props) => {
  if (!countWordsInLast && tag === "lastSentence") return "";
  if (value.multipleTags) {
    return `<td><strong style="color: red">Warning! Number of multiple ${tag} on the page: ${value.quantity}</strong></td><td width="20%"><strong style="color: red">Check the code</strong></td>`;
  } else {
    return textToDisplay({
      forbiddenCharacters: value.forbiddenCharacters,
      maxLength: value.maxLength,
      minLength: value.minLength,
      quantity: value.quantity,
      tag: tag,
      keywordsIncluded: value.keywordsIncluded,
      requirement: value.requirement,
      h1Keywords,
      content: value.content,
      countKeywords,
    });
  }
};
