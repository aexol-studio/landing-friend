import {
  AdvancedTagsNameType,
  AdvancedTagsPatterns,
  AdvancedTagsProps,
  clearContent,
  forbiddenCharacters as _forbiddenCharacters,
  MetaNameTagsProps,
  MetaNameWithProps,
} from "@/index.js";

interface MatchedArrayProps {
  content: string;
}

const matchedTags = (advancedTags: AdvancedTagsNameType, fileContent: string) => {
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

export const checkFileToAdvanceAnalyzer = async ({
  file,
  fileContent,
  advancedTags,
}: {
  file: string;
  fileContent: string;
  advancedTags?: AdvancedTagsProps;
}): Promise<AdvancedTagsPatterns | undefined> => {
  if (!advancedTags) return;

  const advancedTagsPatterns: AdvancedTagsPatterns = {};
  let updatedTagsPatterns = { ...advancedTagsPatterns[file] };
  for (const [_tag, value] of Object.entries(advancedTags)) {
    if (!value) continue;
    const tag = _tag as AdvancedTagsNameType;
    const matches = matchedTags(tag, fileContent);

    if (matches) {
      let listOfFoundMeta: MetaNameWithProps = {};

      for (const match of matches) {
        for (const [metaName, value] of Object.entries(match)) {
          let content: string | undefined = undefined;
          let status: string | undefined;

          content = clearContent(value.content);

          const forbiddenCharacters = _forbiddenCharacters.filter(
            char => content && content.includes(char)
          );
          if (content && content.includes("https")) {
            status = await fetch(content)
              .then(response => response.statusText)
              .catch(err => {
                if (err) {
                  return "Not Found";
                }
              });
          }

          const metaObject: MetaNameWithProps = {
            [metaName]: {
              content: content ? content.trim() : undefined,
              forbiddenCharacters,
              status: status ? status : undefined,
            } as MetaNameTagsProps,
          };
          listOfFoundMeta = { ...listOfFoundMeta, ...metaObject };
        }
        updatedTagsPatterns = {
          ...updatedTagsPatterns,
          [tag]: {
            tagAmount: matches.length,
            listOfFoundMeta,
            isError: Object.values(listOfFoundMeta).some(value => value?.status === "Not Found"),
          } as MetaNameTagsProps,
        };
      }
    } else {
      updatedTagsPatterns = {
        ...updatedTagsPatterns,
        [tag]: {
          tagAmount: NaN,
          isError: true,
        } as MetaNameTagsProps,
      };
    }
  }

  advancedTagsPatterns[file] = updatedTagsPatterns;
  return { ...advancedTagsPatterns, [file]: updatedTagsPatterns };
};
