import { AdditionalTagsName, BasicTagsName, CombineTagsWithReason, TagsName } from "@/index.js";

interface Props {
  tag: BasicTagsName;
  value: CombineTagsWithReason;
  countKeywords: boolean;
  countWordsInLast: boolean;
  trailingSlash?: boolean;
  pathname: string;
  domain: string;
}

export const generateMainSection = ({
  tag,
  countKeywords,
  value,
  countWordsInLast,
  trailingSlash,
  pathname: __pathname,
  domain,
}: Props) => {
  if (!countWordsInLast && tag === AdditionalTagsName.LastSentence) return "";
  if (!countKeywords && tag === AdditionalTagsName.Keywords) return "";
  if (value.multipleTags) {
    return `<td><strong style="color: red">Warning! Number of multiple ${tag} on the page: ${value.quantity}</strong></td><td width="20%"><strong style="color: red">Check the code</strong></td>`;
  } else {
    const _pathname = __pathname.replace("index.html", "");
    const pathname = trailingSlash ? _pathname : _pathname.replace(new RegExp("\\$", "g"), "");
    const url = (domain + pathname).trim();

    const firstCell = `<td>
  ${tag === AdditionalTagsName.Keywords ? "Length of " : "List of "}
  <strong>${tag === AdditionalTagsName.LastSentence ? "last sentence" : tag}</strong>: 
  ${
    value.quantity > 0
      ? tag in TagsName && value.minLength && value.maxLength
        ? `<strong style="color:${
            value.quantity >= value.minLength && value.quantity <= value.maxLength ? "black" : "red"
          }">${value.quantity}</strong>`
        : `<strong style="color: ${
            tag !== AdditionalTagsName.Canonical ? "black" : value.content === url ? "black" : "red"
          }">${
            typeof value.content === "string"
              ? value.content.includes("https")
                ? `<a href="${value.content}" style="cursor:pointer">${value.content}</a>${
                    value.content !== url ? ` | Url not match` : ""
                  }`
                : value.content
              : value.content?.join(", ")
          }</strong>`
      : `<strong style="color:red">No characters detected</strong>`
  }
 ${
   value.quantity > 0 &&
   countKeywords &&
   tag !== AdditionalTagsName.Keywords &&
   tag !== AdditionalTagsName.Canonical
     ? value.keywordsIncluded && value.keywordsIncluded.length > 0
       ? ` | <strong style="color:green">Keywords included: ${value.keywordsIncluded.join(
           ", "
         )}</strong>`
       : ` | <strong style="color:red">Does not contain keywords</strong>`
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
  value.content?.length === 0
    ? `<strong style="color:red">${value.requirement}</strong>`
    : !value.requirement
    ? ""
    : value.minLength && value.maxLength
    ? `<span style="${
        value.quantity >= value.minLength && value.quantity <= value.maxLength
          ? "color: black"
          : "color: red"
      }">${value.requirement}</span>`
    : (countKeywords &&
        ((value.keywordsIncluded && value.keywordsIncluded.length > 0) ||
          (value.missingKeywords && value.missingKeywords.length === 0) ||
          (value.toMuchKeywords && value.toMuchKeywords.length === 0))) ||
      value.content === url
    ? ""
    : countKeywords
    ? `<strong style="color:red">${value.requirement}</strong>`
    : ""
}
    </td>`;

    return `${firstCell}${secondCell}`;
  }
};
