import { arrayFilleter } from "../arrayFillter.js";

interface Props {
  h1Keywords: string[];
  titleKeywords: string[];
  descriptionKeywords: string[];
  lastSentenceKeywords: string[];
}

export const generateMissingKeywordsSection = ({
  h1Keywords,
  titleKeywords,
  descriptionKeywords,
  lastSentenceKeywords,
}: Props) => {
  const missingTitleKeywords = arrayFilleter(h1Keywords, titleKeywords);

  const missingDescriptionKeywords = arrayFilleter(h1Keywords, descriptionKeywords);

  const missingLastSentenceKeywords = arrayFilleter(h1Keywords, lastSentenceKeywords);

  const toMuchTitleKeywords = arrayFilleter(titleKeywords, h1Keywords);

  const toMuchDescriptionKeywords = arrayFilleter(descriptionKeywords, h1Keywords);

  const toMuchLastSentenceKeywords = arrayFilleter(lastSentenceKeywords, h1Keywords);

  let sections = "";
  const missingKeywordsHeader = `<tr><td colspan="2"><strong style="color:red">Missing keywords: </strong></td></tr>`;

  const tooMuchKeywordsHeader = `<tr><td colspan="2"><strong style="color:red">Too much keywords: </strong></td></tr>`;

  const generateMissingKeywordsSection = (tag: string, keywordsList: string[]) => {
    if (keywordsList.length > 0) {
      return `<tr><td colspan="2"><strong>${tag}</strong> : ${keywordsList}</td></tr>`;
    }
    return "";
  };

  const generateTooMuchKeywordsSection = (tag: string, keywordsList: string[]) => {
    if (keywordsList.length > 0) {
      return `<tr><td colspan="2"><strong>${tag}</strong> : ${keywordsList}</td></tr>`;
    }
    return "";
  };

  if (
    missingTitleKeywords.length > 0 ||
    missingDescriptionKeywords.length > 0 ||
    missingLastSentenceKeywords.length > 0
  ) {
    sections += missingKeywordsHeader;
    sections += generateMissingKeywordsSection("Title", missingTitleKeywords);
    sections += generateMissingKeywordsSection("Description", missingDescriptionKeywords);
    sections += generateMissingKeywordsSection("Last Sentence", missingLastSentenceKeywords);
  }

  if (
    toMuchTitleKeywords.length > 0 ||
    toMuchDescriptionKeywords.length > 0 ||
    toMuchLastSentenceKeywords.length > 0
  ) {
    sections += tooMuchKeywordsHeader;
    sections += generateTooMuchKeywordsSection("Title", toMuchTitleKeywords);
    sections += generateTooMuchKeywordsSection("Description", toMuchDescriptionKeywords);
    sections += generateTooMuchKeywordsSection("Last Sentence", toMuchLastSentenceKeywords);
  }

  return sections;
};
