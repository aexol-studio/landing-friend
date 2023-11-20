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

  const fullContentRegex = new RegExp(`<body.*?>(.*?)</body>`, "g");
  const titleRegex = new RegExp(`<title.*?>(.*?)</title.*?>`, "g");
  const descRegex = new RegExp(`<meta name="description" content="(.*?)"`, "g");

  if (fileContent.match(fullContentRegex)?.[0]) {
    const match = fileContent.match(fullContentRegex)?.[0];
    if (match)
      samePage = {
        content: match,
        duplicatesOnSite: [],
        numberOfDuplicates: 0,
      };
  }
  if (fileContent.match(titleRegex)) {
    const match = titleRegex.exec(fileContent)?.[1];
    if (match)
      sameTitle = {
        content: clearContent(match),
        duplicatesOnSite: [],
        numberOfDuplicates: 0,
      };
  }
  if (fileContent.match(descRegex)) {
    const match = descRegex.exec(fileContent)?.[1];
    if (match)
      sameMetaDesc = {
        content: clearContent(match),
        duplicatesOnSite: [],
        numberOfDuplicates: 0,
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
