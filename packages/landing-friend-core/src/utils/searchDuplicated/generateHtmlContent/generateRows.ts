import { FileWithDuplicateContent, generateRow } from "@/index.js";

export const generateRows = (dataArray: FileWithDuplicateContent[]) => {
  let rows = "";
  dataArray
    .map((fileWithContent, tableIndex) => {
      rows = rows + generateRow({ fileWithContent, tableIndex });
    })
    .join("");

  return rows;
};
