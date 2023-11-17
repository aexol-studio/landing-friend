export enum DuplicatedSearchName {
  SamePage = "samePage",
  SameTitle = "sameTitle",
  SameMetaDesc = "sameMetaDesc",
}

export interface DuplicatedContent {
  content?: string;
  numberOfDuplicates?: number;
  duplicatesOnSite?: string[];
}

export type DuplicatedSearchNameTypes = `${DuplicatedSearchName}`;

export type DuplicatedContentWithName = {
  [name in DuplicatedSearchName]?: DuplicatedContent;
};

export type FileWithDuplicateContent = Record<string, DuplicatedContentWithName>;
