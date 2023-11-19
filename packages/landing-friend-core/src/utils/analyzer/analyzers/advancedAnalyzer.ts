import {
  AdvancedTagsNameType,
  AdvancedTagsPatterns,
  AdvancedTagsProps,
  checkMetaTags,
  clearContent,
  forbiddenCharacters as _forbiddenCharacters,
  MetaNameTagsProps,
  MetaNameWithProps,
} from "@/index.js";

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
    const matches = checkMetaTags(tag, fileContent);

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
          if (content.includes("https")) {
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
              content: content.trim(),
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
