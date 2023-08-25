import {
  AdvancedTagsPatterns,
  AdvancedTagsProps,
  CombinedPatterns,
  TagsPatterns,
  TagsProps,
  checkFileToAdvanceAnalyzer,
  checkFileToBasicAnalyzer,
  readFile,
} from "../../index.js";

const mergePatterns = (
  file: string,
  firstPattern: TagsPatterns,
  secondPattern: AdvancedTagsPatterns | undefined
): CombinedPatterns => {
  let combined: CombinedPatterns = {};

  Object.entries(firstPattern).forEach(([entryFile, value]) => {
    if (file === entryFile) {
      combined[entryFile] = { ...value };
    }
  });

  if (secondPattern) {
    Object.entries(secondPattern).forEach(([entryFile, value]) => {
      if (file === entryFile) {
        combined[entryFile] = {
          ...combined[entryFile],
          ...value,
        };
      }
    });
  }

  return { ...combined };
};

export const checkFiles = ({
  file,
  tags,
  advancedTags,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  tags: TagsProps;
  advancedTags?: AdvancedTagsProps;
  countKeywords: boolean;
  countWordsInLast: boolean;
}): CombinedPatterns => {
  const _fileContent = readFile(file);
  const fileContent = _fileContent.replace(/\n\s*/g, " ");
  let tagsPatterns: TagsPatterns = {};
  let advancedTagsPatterns: AdvancedTagsPatterns = {};
  const firstPatterns = checkFileToBasicAnalyzer({
    file,
    fileContent,
    tags,
    tagsPatterns,
    countKeywords,
    countWordsInLast,
  });

  const secondPatterns = checkFileToAdvanceAnalyzer({
    file,
    fileContent,
    advancedTags,
    advancedTagsPatterns,
  });

  return mergePatterns(file, firstPatterns, secondPatterns);
};
