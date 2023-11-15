import { AdditionalTagsNameType, TagsNameType } from "@/index.js";

interface ValueOfTag {
  toMuchKeywords: string[];
  missingKeywords: string[];
}

export type TagsToMissingSection = Exclude<AdditionalTagsNameType, "canonical"> | TagsNameType;

export type DataToMissingSection = Record<TagsToMissingSection, ValueOfTag>;

interface Props {
  h1Keywords: string[] | undefined;
  data: DataToMissingSection;
}

const generateRow = (tag: string, keywordsList: string[]) => {
  if (keywordsList.length > 0) {
    return `<tr><td colspan="2"><strong>${tag}</strong> : ${keywordsList}</td></tr>`;
  }
  return "";
};

export const generateMissingKeywordsSection = ({ h1Keywords, data }: Props) => {
  let sections = "";
  let missingKeywords = "";
  let toMuchKeywords = "";
  const missingKeywordsHeader = `<tr><td colspan="2"><strong style="color:red">Missing keywords: </strong></td></tr>`;

  const toMuchKeywordsHeader = `<tr><td colspan="2"><strong style="color:red">Too much keywords: </strong></td></tr>`;

  if (h1Keywords && h1Keywords.length > 0) {
    Object.entries(data)
      .map(([_tag, value]) => {
        const tag = _tag as TagsToMissingSection;
        if (value.missingKeywords.length > 0) {
          missingKeywords += missingKeywords.includes(missingKeywordsHeader)
            ? ""
            : missingKeywordsHeader;
          missingKeywords += generateRow(tag, value.missingKeywords);
        }
        if (value.toMuchKeywords.length > 0) {
          toMuchKeywords += toMuchKeywords.includes(toMuchKeywordsHeader)
            ? ""
            : toMuchKeywordsHeader;
          toMuchKeywords += generateRow(tag, value.toMuchKeywords);
        }
      })
      .join("");
    sections = missingKeywords.replace(",", ", ") + toMuchKeywords.replace(",", ", ");
  } else {
    sections = `<tr><td colspan="2"><strong style="color:red">Your h1 doesn't contain any keywords.</strong></td></tr>`;
  }

  return sections;
};
