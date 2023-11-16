import {
  BasicTagsName,
  forbiddenCharacters as _forbiddenCharacters,
  staticTags,
  TagsName,
  TagsPatterns,
  TagsProps,
  TagsWithReason,
  unicode,
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

interface CheckFileToBasicAnalyzer {
  file: string;
  fileContent: string;
  tags: TagsProps;
  domain: string;
  countKeywords: boolean;
  countWordsInLast: boolean;
}

export const checkFileToBasicAnalyzer = ({
  file,
  fileContent,
  tags,
  domain,
  countKeywords,
  countWordsInLast,
}: CheckFileToBasicAnalyzer): TagsPatterns => {
  const tagsPatterns: TagsPatterns = {};
  let updatedTagsPatterns = { ...tagsPatterns[file] };
  let mainKeywordsArray: string[] = [];
  let h1Keywords: string[] = [];
  const url = domain + file.replace("index.html", "");

  if (tags.keywords.count) {
    const keywordsMatch = checkContent("keywords", fileContent);
    const h1Match = checkContent("h1", fileContent);

    if (keywordsMatch && keywordsMatch.length > 0) {
      const keywords = keywordsMatch[0].split(", ");
      mainKeywordsArray = keywords;
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

    if (!countKeywords && tag === "keywords") return;
    if (!countWordsInLast && tag === "lastSentence") return;
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

          const tagKeywords =
            tag === "canonical"
              ? undefined
              : !tags.keywords.count
              ? undefined
              : tag === "keywords"
              ? mainKeywordsArray
              : mainKeywordsArray.length > 0
              ? mainKeywordsArray.filter(keyword =>
                  match.toLowerCase().includes(keyword.toLowerCase())
                )
              : undefined;

          if (h1Keywords.length > 0) {
            if (tag in TagsName || tag === "lastSentence") {
              missingKeywords = arrayFilter(h1Keywords, tagKeywords ? tagKeywords : []);
              toMuchKeywords = arrayFilter(tagKeywords ? tagKeywords : [], h1Keywords);
            }
          }

          const isError = () => {
            const { minLength, maxLength } = value;
            const isLengthInvalid =
              minLength && maxLength && (match.length < minLength || match.length > maxLength);
            const isH1Exist =
              countKeywords && mainKeywordsArray.length > 0
                ? tag === "h1" && h1Keywords.length === 0
                : false;
            const areKeywordsMissingOrExcessive =
              countKeywords || isH1Exist || mainKeywordsArray.length === 0
                ? missingKeywords.length > 0 || toMuchKeywords.length > 0
                : false;

            return (
              isLengthInvalid ||
              areKeywordsMissingOrExcessive ||
              isH1Exist ||
              (tag === "canonical" && match !== url) ||
              forbiddenCharacters.length > 0
            );
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
