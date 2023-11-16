import path from "path";

import {
  AdvancedTagsPatterns,
  AdvancedTagsProps,
  checkFileToAdvanceAnalyzer,
  checkFileToBasicAnalyzer,
  CombinedPatterns,
  readFile,
  TagsPatterns,
  TagsProps,
} from "@/index.js";

const mergePatterns = (
  file: string,
  firstPattern: TagsPatterns,
  secondPattern: AdvancedTagsPatterns | undefined
): CombinedPatterns => {
  const combined: CombinedPatterns = {};

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

export const checkFiles = async ({
  file,
  input,
  tags,
  advancedTags,
  domain,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  input: string;
  tags: TagsProps;
  advancedTags?: AdvancedTagsProps;
  domain: string;
  countKeywords: boolean;
  countWordsInLast: boolean;
}): Promise<CombinedPatterns> => {
  const _fileContent = readFile(path.join(process.cwd(), input.replace(/\.\//g, ""), file));
  const fileContent = _fileContent.replace(/\r?\n\s*/g, " ");

  const firstPatternsPromise = checkFileToBasicAnalyzer({
    file: file.replace("\\", "/"),
    fileContent,
    tags,
    domain,
    countKeywords,
    countWordsInLast,
  });

  const secondPatternsPromise = checkFileToAdvanceAnalyzer({
    file: file.replace("\\", "/"),
    fileContent,
    advancedTags,
  });

  const [firstPatterns, secondPatterns] = await Promise.all([
    firstPatternsPromise,
    secondPatternsPromise,
  ]);

  return mergePatterns(file, firstPatterns, secondPatterns);
};
