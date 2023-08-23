import {
  AdvancedTagsProps,
  TagsProps,
  staticTags,
  unicode,
  forbiddenCharacters as _forbiddenCharacters,
  readFile,
} from "../index.js";

export type TagsPatterns = Record<string, Record<string, TagsWithReason>>;

export type TagsWithReason = {
  minLength?: number;
  maxLength?: number;
  countKeywords?: boolean;
  countWordsInLast?: boolean;
  content?: string;
  requirement?: string;
  count: number;
  multipleTags?: boolean;
  keywordsIncluded?: string[];
  forbiddenCharacters?: string[];
};

const matchTag = (tag: string, value: TagsWithReason) => {
  if (tag === "description") {
    return new RegExp(`<meta name="description" content="(.*?)"`, "gs");
  } else if (
    typeof value === "object" &&
    value.countKeywords &&
    tag === "keywords"
  ) {
    return new RegExp(`<meta property="keywords" content="(.*?)"`, "gs");
  } else if (
    typeof value === "object" &&
    value.countWordsInLast &&
    tag === "lastSentence"
  ) {
    return new RegExp(`<div.*?>(.*?)<\/div>`, "gs");
  } else {
    return new RegExp(`<${tag}.*?>(.*?)</${tag}>`, "gs");
  }
};

export const checkFiles = ({
  file,
  tags,
  advancedTags,
  tagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  tags: TagsProps;
  advancedTags?: AdvancedTagsProps;
  tagsPatterns: TagsPatterns;
  countKeywords: boolean;
  countWordsInLast: boolean;
}) => {
  const fileContent = readFile(file);
  checkFileByPatterns({
    file,
    fileContent,
    tags,
    advancedTags,
    tagsPatterns,
    countKeywords,
    countWordsInLast,
  });
};

const checkFileByPatterns = ({
  file,
  fileContent: _fileContent,
  tags,
  tagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  fileContent: string;
  tags: TagsProps;
  advancedTags?: AdvancedTagsProps;
  tagsPatterns: TagsPatterns;
  countKeywords: boolean;
  countWordsInLast: boolean;
}) => {
  Object.entries(tags).forEach(([tag, value]) => {
    let fileContent = _fileContent.replace(/\n\s*/g, " ");

    const regex = matchTag(tag, value);
    let keywordsArray: string[] | undefined = [];
    if (countKeywords) {
      const keywordsMatch = fileContent.match(
        new RegExp(`<meta property="keywords" content="(.*?)"`, "gs")
      );

      if (keywordsMatch && keywordsMatch.length > 0) {
        const contentMatch = keywordsMatch[0].match(/content="(.*?)"/);

        if (contentMatch && contentMatch[1]) {
          const keywords = contentMatch[1].split(", ");
          keywordsArray = keywords.map((keyword) => keyword.trim());
        }
      }
    }

    let matches = fileContent.match(regex);
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
            count: matches.length,
            multipleTags: true,
            countKeywords,
            countWordsInLast,
          },
        });
      } else {
        matches.forEach((match) => {
          let text: string;

          if (tag === "description") {
            text = match.replace(
              /<meta name="description" content="|\"$/gs,
              ""
            );
          } else if (
            typeof value === "object" &&
            "countKeywords" in value &&
            value.countKeywords &&
            tag === "keywords"
          ) {
            text = match.replace(
              /<meta property="keywords" content="|\"$/gs,
              ""
            );
          } else if (
            typeof value === "object" &&
            "countWordsInLast" in value &&
            value.countWordsInLast &&
            tag === "lastSentence"
          ) {
            text = match.replace(new RegExp(`^<div.*?>|</div>$`, "gs"), "");
          } else {
            text = match.replace(
              new RegExp(`^<${tag}.*?>|</${tag}>$`, "gs"),
              ""
            );
          }

          staticTags.forEach((staticTag) => {
            const staticTagRegex = new RegExp(
              `<${staticTag}.*?>|<\/${staticTag}>`,
              "gs"
            );
            Object.entries(unicode).forEach(([unicode, replacement]) => {
              const unicodeRegex = new RegExp(`${unicode}`, "gs");
              text = text.replace(unicodeRegex, replacement);
            });

            text = text.replace(staticTagRegex, "");
          });

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
              count: text.length,
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
          count: NaN,
          countKeywords,
          countWordsInLast,
        },
      });
    }
  });
};
