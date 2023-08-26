import path from "path";
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
  input,
  tags,
  advancedTags,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  input: string;
  tags: TagsProps;
  advancedTags?: AdvancedTagsProps;
  countKeywords: boolean;
  countWordsInLast: boolean;
}): CombinedPatterns => {
  const _fileContent = readFile(
    path.join(process.cwd(), input.replace(/\.\//g, ""), file)
  );
  const fileContent = _fileContent.replace(/\r?\n\s*/g, " ");

  let tagsPatterns: TagsPatterns = {};
  let advancedTagsPatterns: AdvancedTagsPatterns = {};
  const firstPatterns = checkFileToBasicAnalyzer({
    file: file.replace("\\", "/"),
    fileContent,
    tags,
    tagsPatterns,
    countKeywords,
    countWordsInLast,
  });

  const secondPatterns = checkFileToAdvanceAnalyzer({
    file: file.replace("\\", "/"),
    fileContent,
    advancedTags,
    advancedTagsPatterns,
  });

  return mergePatterns(file, firstPatterns, secondPatterns);
};
