import { AdvancedTagsNameType } from "@/index.js";

interface MatchedArrayProps {
  content: string;
}

export const checkMetaTags = (advancedTags: AdvancedTagsNameType, fileContent: string) => {
  let regex: RegExp | undefined;
  const matchedArray: { [tagName: string]: MatchedArrayProps }[] = [];

  if (advancedTags === "og") {
    regex = new RegExp(`<meta property="og:(.*?)" content="(.*?)".*?/>`, "gs");
  } else if (advancedTags === "twitter") {
    regex = new RegExp(`<meta name="twitter:(.*?)" content="(.*?)".*?/>`, "gs");
  }

  if (regex) {
    const matches = fileContent.match(regex);
    if (matches) {
      matches.forEach(match => {
        let tagObject: { [x: string]: { content: string } };
        const captureGroups = regex!.exec(match);
        if (captureGroups) {
          const tagName = captureGroups[1];
          const content = captureGroups[2];
          tagObject = { [tagName]: { content } };

          matchedArray.push(tagObject);

          regex!.lastIndex = 0;
        }
      });
    }
  }

  return matchedArray;
};
