import { DuplicatedSearchName, FileWithDuplicateContent } from "@/index.js";

export const findAndStoreDuplicates = (
  fileWithContent: FileWithDuplicateContent,
  contentArray: FileWithDuplicateContent[],
  file: string
): FileWithDuplicateContent[] => {
  const newArray = [...contentArray];
  const fileWithContentToCompare = fileWithContent[file];
  newArray.forEach(existFileWithContent => {
    Object.entries(existFileWithContent).forEach(([arrayFile, arrayValue]) => {
      for (const name of Object.values(DuplicatedSearchName)) {
        const contentToCompare = fileWithContentToCompare[name];
        const existContent = arrayValue[name];
        if (contentToCompare && existContent) {
          if (contentToCompare.content === existContent.content) {
            existContent.numberOfDuplicates++;
            contentToCompare.numberOfDuplicates++;
            existContent.duplicatesOnSite.push(file);
            contentToCompare.duplicatesOnSite.push(arrayFile);
          }
        }
      }
    });
  });
  newArray.push(fileWithContent);
  return newArray.sort((a, b) => {
    let aValue = 0;
    let bValue = 0;
    for (const name of Object.values(DuplicatedSearchName)) {
      Object.values(a).forEach(value => {
        return (aValue += value[name]?.numberOfDuplicates || 0);
      });
      Object.values(b).forEach(value => {
        return (bValue += value[name]?.numberOfDuplicates || 0);
      });
    }
    return bValue - aValue;
  });
};
