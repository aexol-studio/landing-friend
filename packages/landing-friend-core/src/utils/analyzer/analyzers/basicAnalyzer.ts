import {
  TagsProps,
  staticTags,
  unicode,
  forbiddenCharacters as _forbiddenCharacters,
  TagsPatterns,
  BasicTagsName,
  TagsWithReason,
  TagsName,
} from "@/index.js";

const arrayFilter = (firstArray: string[], secondArray: string[]) => {
  return firstArray.filter(element => !secondArray.includes(element));
};

const checkContent = (tagName: BasicTagsName, fileContent: string) => {
  let regex: RegExp | undefined;
  let matches: RegExpMatchArray | null = null;

  if (tagName === "description") {
    regex = new RegExp(`<meta name="description" content="(.*?)"`, "g");
  } else if (tagName === "keywords") {
    regex = new RegExp(`<meta property="keywords" content="(.*?)"`, "g");
  } else if (tagName === "canonical") {
    regex = new RegExp(`<link rel="canonical" href="(.*?)"`, "g");
  } else if (tagName === "lastSentence") {
    regex = new RegExp(`<div.*?>(.*?)</div>`, "g");
  } else {
    regex = new RegExp(`<${tagName}.*?>(.*?)</${tagName}>`, "g");
  }

  matches = regex && fileContent.match(regex);

  if (tagName === "lastSentence" && matches !== null) {
    const lastMatch = matches[matches.length - 1];
    matches = lastMatch !== undefined ? [lastMatch] : null;
  }

  if (matches) {
    const updatedMatches = [...matches];
    updatedMatches.forEach((match, index) => {
      const captureGroups = regex!.exec(match);
      if (captureGroups) {
        let content = captureGroups[1];
        staticTags.forEach(staticTag => {
          const staticTagRegex = new RegExp(
            `<${staticTag}.*?>|</${staticTag}>|\\.css.*?}|@media.*?}|{|}`,
            "g"
          );
          Object.entries(unicode).forEach(([unicode, replacement]) => {
            const unicodeRegex = new RegExp(`${unicode}`, "g");
            content = content.replace(unicodeRegex, replacement);
          });

          content = content.replace(staticTagRegex, "");
        });

        updatedMatches[index] = content;
      }
    });

    matches = updatedMatches as RegExpMatchArray;
  }

  return matches;
};

export const checkFileToBasicAnalyzer = ({
  file,
  fileContent,
  tags,
}: {
  file: string;
  fileContent: string;
  tags: TagsProps;
}): TagsPatterns => {
  const tagsPatterns: TagsPatterns = {};
  let updatedTagsPatterns = { ...tagsPatterns[file] };
  let keywordsArray: string[] | undefined;
  let h1Keywords: string[] | undefined;

  if (tags.keywords.count) {
    const keywordsMatch = checkContent("keywords", fileContent);
    const h1Match = checkContent("h1", fileContent);

    if (keywordsMatch && keywordsMatch.length > 0) {
      const keywords = keywordsMatch[0].split(", ");
      keywordsArray = keywords;
      if (h1Match && h1Match.length > 0) {
        let selectedH1: string = "";
        h1Match.forEach(match => (selectedH1 = match.toLowerCase()));
        h1Keywords = keywords.filter(keyword => selectedH1.includes(keyword.toLowerCase()));
      }
    }
  }

  Object.entries(tags).forEach(([_tag, _value]) => {
    const tag = _tag as BasicTagsName;
    const value = _value as TagsWithReason;

    const matches = checkContent(tag, fileContent);

    if (matches) {
      if (matches.length > 1) {
        updatedTagsPatterns = tagsPatterns[file] = {
          ...tagsPatterns[file],
          [tag]: {
            ...value,
            requirement: "Check the code",
            quantity: matches.length,
            multipleTags: true,
            isError: true,
          } as TagsWithReason,
        };
      } else {
        matches.forEach(match => {
          const forbiddenCharacters = _forbiddenCharacters.filter(char => match.includes(char));
          let missingKeywords: string[] = [];
          let toMuchKeywords: string[] = [];

          const tagKeywords = !tags.keywords.count
            ? undefined
            : tag === "keywords"
            ? keywordsArray
            : keywordsArray
            ? keywordsArray.filter(keyword => match.toLowerCase().includes(keyword.toLowerCase()))
            : undefined;

          if (h1Keywords && tagKeywords) {
            if (tag in TagsName || tag === "lastSentence") {
              missingKeywords = arrayFilter(h1Keywords, tagKeywords);
              toMuchKeywords = arrayFilter(tagKeywords, h1Keywords);
            }
          }

          const isError = () => {
            const { minLength, maxLength } = value;
            const isLengthInvalid =
              minLength && maxLength && (match.length < minLength || match.length > maxLength);
            const areKeywordsMissingOrExcessive =
              missingKeywords.length > 0 || toMuchKeywords.length > 0 || match.length === 0;

            return isLengthInvalid || areKeywordsMissingOrExcessive;
          };

          return (updatedTagsPatterns = tagsPatterns[file] =
            {
              ...tagsPatterns[file],
              [tag]: {
                ...value,
                maxLength: value.maxLength,
                minLength: value.minLength,
                requirement:
                  tag === "keywords"
                    ? undefined
                    : tag === "lastSentence"
                    ? "Tag should contain the same keywords as upper tags"
                    : tag === "canonical"
                    ? "The canonical link must be the same as the URL."
                    : `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
                quantity: match.length,
                content: tag === "keywords" ? tagKeywords : match,
                multipleTags: undefined,
                keywordsIncluded: tagKeywords,
                forbiddenCharacters:
                  forbiddenCharacters.length > 0 ? forbiddenCharacters : undefined,
                missingKeywords: missingKeywords.length > 0 ? missingKeywords : undefined,
                toMuchKeywords: toMuchKeywords.length > 0 ? toMuchKeywords : undefined,
                isError: isError(),
              } as TagsWithReason,
            });
        });
      }
    } else {
      updatedTagsPatterns = tagsPatterns[file] = {
        ...tagsPatterns[file],
        [tag]: {
          ...value,
          requirement:
            tag === "keywords"
              ? "At least one keyword required"
              : tag === "lastSentence"
              ? "Tag should contain the same keywords as upper tags"
              : tag === "canonical"
              ? "The canonical link must be the same as the URL."
              : `Tag length should be between <strong>${value.minLength}</strong> and <strong>${value.maxLength}</strong>`,
          quantity: 0,
          isError: true,
        } as TagsWithReason,
      };
    }
  });

  return { ...tagsPatterns, [file]: updatedTagsPatterns };
};
