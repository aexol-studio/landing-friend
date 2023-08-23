import {
  TagsProps,
  staticTags,
  unicode,
  forbiddenCharacters as _forbiddenCharacters,
  TagsPatterns,
  AllTagsName,
  TagsWithReason,
} from "../../index.js";

const checkContent = (tagsName: AllTagsName, fileContent: string) => {
  let regex: RegExp | undefined;
  const matchedArray: string[] = [];
  if (tagsName === "description") {
    regex = new RegExp(`<meta name="description" content="(.*?)"`, "g");
  } else if (tagsName === "keywords") {
    regex = new RegExp(`<meta property="keywords" content="(.*?)"`, "g");
  } else if (tagsName === "lastSentence") {
    regex = new RegExp(`<div.*?>(.*?)<\/div>`, "g");
  } else {
    regex = new RegExp(`<${tagsName}.*?>(.*?)</${tagsName}>`, "g");
  }

  if (regex) {
    const matches = fileContent.match(regex);
    if (matches) {
      matches.forEach((match) => {
        const captureGroups = regex!.exec(match);
        if (captureGroups) {
          let content = captureGroups[1];

          staticTags.forEach((staticTag) => {
            const staticTagRegex = new RegExp(
              `<${staticTag}.*?>|<\/${staticTag}>`,
              "g"
            );
            Object.entries(unicode).forEach(([unicode, replacement]) => {
              const unicodeRegex = new RegExp(`${unicode}`, "g");
              content = content.replace(unicodeRegex, replacement);
            });

            content = content.replace(staticTagRegex, "");
          });

          matchedArray.push(content);
        }
      });
    }
  }

  return matchedArray;
};

export const checkFileToBasicAnalyzer = ({
  file,
  fileContent,
  tags,
  tagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  fileContent: string;
  tags: TagsProps;
  tagsPatterns: TagsPatterns;
  countKeywords: boolean;
  countWordsInLast: boolean;
}) => {
  Object.entries(tags).forEach(([_tag, _value]) => {
    const tag = _tag as AllTagsName;
    let value = _value as TagsWithReason;
    let keywordsArray: string[] | undefined = [];
    if (countKeywords) {
      const keywordsMatch = fileContent.match(
        new RegExp(`<meta property="keywords" content="(.*?)"`, "g")
      );

      if (keywordsMatch && keywordsMatch.length > 0) {
        const contentMatch = keywordsMatch[0].match(/content="(.*?)"/);

        if (contentMatch && contentMatch[1]) {
          const keywords = contentMatch[1].split(", ");
          keywordsArray = keywords.map((keyword) => keyword.trim());
        }
      }
    }

    let matches = checkContent(tag, fileContent);
    if (tag === "lastSentence" && matches) {
      matches = [matches[matches.length - 1]];
    }

    if (matches) {
      if (matches.length > 1) {
        return (tagsPatterns[file] = {
          ...tagsPatterns[file],
          [tag]: {
            ...value,
            requirement: `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
            quantity: matches.length,
            multipleTags: true,
            countKeywords,
            countWordsInLast,
          },
        });
      } else {
        matches.forEach((match) => {
          let text = match;

          const forbiddenCharacters = _forbiddenCharacters.filter((char) =>
            text.includes(char)
          );

          return (tagsPatterns[file] = {
            ...tagsPatterns[file],
            [tag]: {
              ...value,
              maxLength: tag !== "keywords" ? value.maxLength : undefined,
              minLength: tag !== "keywords" ? value.minLength : undefined,
              requirement:
                tag === "keywords"
                  ? undefined
                  : `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
              quantity: text.length,
              content: text,
              multipleTags: undefined,
              keywordsIncluded:
                tag !== "keywords" || countKeywords
                  ? keywordsArray?.filter((keyword) =>
                      text.toLowerCase().includes(keyword.toLowerCase())
                    )
                  : undefined,
              forbiddenCharacters:
                forbiddenCharacters.length > 0
                  ? forbiddenCharacters
                  : undefined,
              countKeywords,
              countWordsInLast,
            },
          });
        });
      }
    } else {
      return (tagsPatterns[file] = {
        ...tagsPatterns[file],
        [tag]: {
          ...value,
          requirement:
            tag === "keywords"
              ? `At least one keyword required`
              : `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
          quantity: NaN,
          countKeywords,
          countWordsInLast,
        },
      });
    }
  });
};
