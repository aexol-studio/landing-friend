import path from "path";

import {
  clearContent,
  DuplicatedContent,
  DuplicatedContentWithName,
  FileWithDuplicateContent,
  readFile,
} from "@/index.js";

interface Props {
  file: string;
  input: string;
}

const checkContent = (fileContent: string): DuplicatedContentWithName => {
  let samePage: DuplicatedContent | undefined;
  let sameTitle: DuplicatedContent | undefined;
  let sameMetaDesc: DuplicatedContent | undefined;

  const fullContentRegex = new RegExp(`<html.*?>(.*?)</html>`, "g");
  const titleRegex = new RegExp(`<title.*?>(.*?)</title.*?>`, "g");
  const descRegex = new RegExp(`<meta name="description" content="(.*?)" />`, "g");

  if (fileContent.match(fullContentRegex)) {
    // const match = fileContent.match(fullContentRegex)?.[0];
    samePage = {
      content: undefined,
    };
  }
  if (fileContent.match(titleRegex)) {
    const match = titleRegex.exec(fileContent)?.[1];
    sameTitle = {
      content: clearContent(match),
    };
  }
  if (fileContent.match(descRegex)) {
    const match = fileContent.match(descRegex)?.[1];
    sameMetaDesc = {
      content: clearContent(match),
    };
  }

  return { sameMetaDesc, samePage, sameTitle };
};

export const getContent = async ({ file, input }: Props) => {
  const _fileContent = readFile(path.join(process.cwd(), input, file));
  const fileContent = _fileContent.replace(/\r?\n\s*/g, " ");

  const content: FileWithDuplicateContent = { [file]: checkContent(fileContent) };

  return content;
};
