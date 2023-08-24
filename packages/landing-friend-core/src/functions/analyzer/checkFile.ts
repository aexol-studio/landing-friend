import {
  AdvancedTagsPatterns,
  AdvancedTagsProps,
  TagsPatterns,
  TagsProps,
  checkFileToAdvanceAnalyzer,
  checkFileToBasicAnalyzer,
  readFile,
} from "../../index.js";

export const checkFiles = ({
  file,
  tags,
  advancedTags,
  tagsPatterns,
  advancedTagsPatterns,
  countKeywords,
  countWordsInLast,
}: {
  file: string;
  tags: TagsProps;
  advancedTags?: AdvancedTagsProps;
  tagsPatterns: TagsPatterns;
  advancedTagsPatterns: AdvancedTagsPatterns;
  countKeywords: boolean;
  countWordsInLast: boolean;
}) => {
  const _fileContent = readFile(file);
  const fileContent = _fileContent.replace(/\n\s*/g, " ");
  const basicAnalyze = checkFileToBasicAnalyzer({
    file,
    fileContent,
    tags,
    tagsPatterns,
    countKeywords,
    countWordsInLast,
  });
  const advancedAnalyze = checkFileToAdvanceAnalyzer({
    file,
    fileContent,
    advancedTags,
    advancedTagsPatterns,
  });

  return { basicAnalyze, advancedAnalyze };
};
