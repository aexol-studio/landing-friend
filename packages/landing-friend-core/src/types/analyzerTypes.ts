export enum advancedTagsName {
  og = "og",
  twitter = "twitter",
}

export type AdvancedTagsName = keyof typeof advancedTagsName;

export enum tagsName {
  h1 = "h1",
  title = "title",
  description = "description",
}

export type TagsName = keyof typeof tagsName;

export enum additionalTagsName {
  lastSentence = "lastSentence",
  keywords = "keywords",
  canonical = "canonical",
}

export type AdditionalTagsName = keyof typeof additionalTagsName;

export type BasicTagsName = TagsName | AdditionalTagsName;

export type AllTagsName = BasicTagsName | AdvancedTagsName;

export type TagsProps = Record<
  TagsName,
  {
    minLength: number;
    maxLength: number;
  }
> &
  Record<AdditionalTagsName, { count: boolean }>;

export type AdvancedTagsProps = Record<AdvancedTagsName, boolean>;

export interface TagsWithReason {
  quantity: number;
  minLength?: number;
  maxLength?: number;
  content?: string;
  requirement?: string;
  multipleTags?: boolean;
  keywordsIncluded?: string[];
  forbiddenCharacters?: string[];
}

export interface MetaNameTagsProps {
  content?: string;
  forbiddenCharacters?: string[];
  status?: string;
}

export type MetaNameWithProps = {
  [metaName in string]?: MetaNameTagsProps;
};

export interface AdvancedTagsWithReason {
  tagAmount: number;
  listOfFoundMeta?: MetaNameWithProps;
}

export interface CombineTagsWithReason extends TagsWithReason, AdvancedTagsWithReason {}

export type TagsPatterns = Record<string, Record<AllTagsName, TagsWithReason>>;

export type AdvancedTagsPatterns = Record<string, Record<AdvancedTagsName, AdvancedTagsWithReason>>;

export type CombinedPatterns = {
  [key: string]:
    | {
        [tag in BasicTagsName]: TagsWithReason;
      }
    | {
        [tag in AdvancedTagsName]?: AdvancedTagsWithReason;
      };
};
