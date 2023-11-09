import {
  TagsProps,
  staticTags,
  unicode,
  forbiddenCharacters as _forbiddenCharacters,
  TagsPatterns,
  BasicTagsName,
  TagsWithReason,
} from "../../index.js";

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

  if (regex) {
    matches = fileContent.match(regex);

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
  Object.entries(tags).forEach(([_tag, _value]) => {
    const tag = _tag as BasicTagsName;
    const value = _value as TagsWithReason;
    let keywordsArray: string[] | undefined = [];
    if (tags.keywords.count) {
      const keywordsMatch = fileContent.match(
        new RegExp('<meta property="keywords" content="(.*?)"', "g")
      );

      if (keywordsMatch && keywordsMatch.length > 0) {
        const contentMatch = keywordsMatch[0].match(/content="(.*?)"/);

        if (contentMatch && contentMatch[1]) {
          const keywords = contentMatch[1].split(", ");
          keywordsArray = keywords.map(keyword => keyword.trim());
        }
      }
    }

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
          },
        };
      } else {
        matches.forEach(match => {
          const text = match;

          const forbiddenCharacters = _forbiddenCharacters.filter(char => text.includes(char));

          updatedTagsPatterns = tagsPatterns[file] = {
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
              quantity: text.length,
              content: text,
              multipleTags: undefined,
              keywordsIncluded:
                tag !== "keywords" || tags.keywords.count
                  ? keywordsArray?.filter(keyword =>
                      text.toLowerCase().includes(keyword.toLowerCase())
                    )
                  : undefined,
              forbiddenCharacters: forbiddenCharacters.length > 0 ? forbiddenCharacters : undefined,
            },
          };
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
        },
      };
    }
  });
  return { ...tagsPatterns, [file]: updatedTagsPatterns };
};
