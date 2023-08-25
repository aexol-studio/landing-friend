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
    regex = new RegExp(
      `<meta property=\"og:(.*?)\" content=\"(.*?)\" />`,
      "gs"
    );
  } else if (advancedTags === "twitter") {
    regex = new RegExp(
      `<meta name=\"twitter:(.*?)\" content=\"(.*?)\" />`,
      "gs"
    );
  }

  if (regex) {
    const matches = fileContent.match(regex);
    if (matches) {
      matches.forEach((match) => {
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

export const checkFileToAdvanceAnalyzer = ({
  file,
  fileContent,
  advancedTags,
  advancedTagsPatterns,
}: {
  file: string;
  fileContent: string;
  advancedTags?: AdvancedTagsProps;
  advancedTagsPatterns: AdvancedTagsPatterns;
}): AdvancedTagsPatterns | undefined => {
  if (!advancedTags) {
    return;
  }
  let updatedTagsPatterns = { ...advancedTagsPatterns[file] };
  Object.entries(advancedTags).forEach(([_tag, value]) => {
    if (!value) return;
    const tag = _tag as AdvancedTagsName;
    const matches = matchedTags(tag, fileContent);

    if (matches) {
      let listOfFoundMeta: MetaNameWithProps = {};
      matches.forEach((match) => {
        Object.entries(match).map(([metaName, value]) => {
          let content: string;
          staticTags.forEach((staticTag) => {
            const _content = value.content;
            const staticTagRegex = new RegExp(
              `<${staticTag}.*?>|<\/${staticTag}>`,
              "g"
            );
            Object.entries(unicode).forEach(([unicode, replacement]) => {
              const unicodeRegex = new RegExp(`${unicode}`, "g");
              content = _content.replace(unicodeRegex, replacement);
            });

            content = _content.replace(staticTagRegex, "");
          });

          const forbiddenCharacters = _forbiddenCharacters.filter((char) =>
            content.includes(char)
          );
          const metaObject: MetaNameWithProps = {
            [metaName]: {
              content: value.content,
              forbiddenCharacters,
            },
          };
          listOfFoundMeta = { ...listOfFoundMeta, ...metaObject };
        });
        updatedTagsPatterns = advancedTagsPatterns[file] = {
          ...advancedTagsPatterns[file],
          [tag]: {
            tagAmount: matches.length,
            listOfFoundMeta,
          },
        };
      });
    } else {
      updatedTagsPatterns = advancedTagsPatterns[file] = {
        ...advancedTagsPatterns[file],
        [tag]: {
          tagAmount: NaN,
        },
      };
    }
  });
  // console.log(JSON.stringify(advancedTagsPatterns, null, 2));

  return { ...advancedTagsPatterns, [file]: updatedTagsPatterns };
};
