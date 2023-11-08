import {
  AdvancedTagsProps,
  staticTags,
  unicode,
  forbiddenCharacters as _forbiddenCharacters,
  AdvancedTagsName,
  AdvancedTagsPatterns,
  MetaNameWithProps,
} from "../../index.js";

interface MatchedArrayProps {
  content: string;
}

const matchedTags = (advancedTags: AdvancedTagsName, fileContent: string) => {
  let regex: RegExp | undefined;
  const matchedArray: { [tagName: string]: MatchedArrayProps }[] = [];

  if (advancedTags === "og") {
    regex = new RegExp('<meta property="og:(.*?)" content="(.*?)".*?/>', "gs");
  } else if (advancedTags === "twitter") {
    regex = new RegExp('<meta name="twitter:(.*?)" content="(.*?)".*?/>', "gs");
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
    const tag = _tag as AdvancedTagsName;
    const matches = matchedTags(tag, fileContent);

    if (matches) {
      let listOfFoundMeta: MetaNameWithProps = {};

      for (const match of matches) {
        for (const [metaName, value] of Object.entries(match)) {
          let content: string | undefined;
          let status: string | undefined;

          for (const staticTag of staticTags) {
            const _content = value.content;
            const staticTagRegex = new RegExp(`<${staticTag}.*?>|</${staticTag}>`, "g");
            for (const [_unicode, replacement] of Object.entries(unicode)) {
              const unicodeRegex = new RegExp(`${_unicode}`, "g");
              content = _content.replace(unicodeRegex, replacement);
            }

            content = _content.replace(staticTagRegex, "");
          }

          const forbiddenCharacters = _forbiddenCharacters.filter(
            char => content && content.includes(char)
          );
          if (content && content.includes("https")) {
            const response = await fetch(content);
            status = response.statusText;
          }

          const metaObject: MetaNameWithProps = {
            [metaName]: {
              content,
              forbiddenCharacters,
              status: status ? status : undefined,
            },
          };
          listOfFoundMeta = { ...listOfFoundMeta, ...metaObject };
        }
        updatedTagsPatterns = {
          ...updatedTagsPatterns,
          [tag]: {
            tagAmount: matches.length,
            listOfFoundMeta,
          },
        };
      }
    } else {
      updatedTagsPatterns = {
        ...updatedTagsPatterns,
        [tag]: {
          tagAmount: NaN,
        },
      };
    }
  }

  advancedTagsPatterns[file] = updatedTagsPatterns;
  return { ...advancedTagsPatterns, [file]: updatedTagsPatterns };
};
