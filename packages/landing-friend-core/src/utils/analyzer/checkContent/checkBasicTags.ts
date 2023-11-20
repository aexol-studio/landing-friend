import { AdditionalTagsName, BasicTagsName, clearContent } from "@/index.js";

export const checkBasicTags = (tagName: BasicTagsName, fileContent: string) => {
  let regex: RegExp | undefined;
  let regexMatch: RegExpMatchArray | null = null;
  let matches: string[] | undefined;

  if (tagName === "description") {
    regex = new RegExp(`<meta name="description" content="(.*?)"`, "g");
  } else if (tagName === AdditionalTagsName.Keywords) {
    regex = new RegExp(`<meta property="keywords" content="(.*?)"`, "g");
  } else if (tagName === AdditionalTagsName.Canonical) {
    regex = new RegExp(`<link rel="canonical" href="(.*?)"`, "g");
  } else if (tagName === AdditionalTagsName.LastSentence) {
    regex = new RegExp(`<div.*?>(.*?)</div>`, "g");
  } else {
    regex = new RegExp(`<${tagName}.*?>(.*?)</${tagName}>`, "g");
  }

  regexMatch = regex && fileContent.match(regex);

  if (tagName === AdditionalTagsName.LastSentence && regexMatch !== null) {
    const lastMatch = regexMatch[regexMatch.length - 1];
    regexMatch = lastMatch !== undefined ? [lastMatch] : null;
  }

  if (regexMatch) {
    const updatedMatches = [...regexMatch];
    updatedMatches.forEach((match, index) => {
      const captureGroups = regex!.exec(match);
      if (captureGroups) {
        const cleanedMatch = clearContent(captureGroups[1]);
        updatedMatches[index] = cleanedMatch;
      }
    });

    matches = updatedMatches;
  }

  return matches;
};
