export enum AdvancedTagsName {
  Og = "og",
  Twitter = "twitter",
}

export type AdvancedTagsNameType = `${AdvancedTagsName}`;

export enum TagsName {
  H1 = "h1",
  Title = "title",
  Description = "description",
}

export type TagsNameType = `${TagsName}`;

export enum AdditionalTagsName {
  LastSentence = "lastSentence",
  Keywords = "keywords",
  Canonical = "canonical",
}

export type AdditionalTagsNameType = `${AdditionalTagsName}`;

export type BasicTagsName = TagsNameType | AdditionalTagsNameType;

export type AllTagsName = BasicTagsName | AdvancedTagsNameType;

export type TagsProps = Record<TagsNameType, { minLength: number; maxLength: number }> &
  Record<AdditionalTagsNameType, { count: boolean }>;

export type AdvancedTagsProps = Record<AdvancedTagsNameType, boolean>;

export interface TagsWithReason {
  quantity: number;
  minLength?: number;
  maxLength?: number;
  content?: string | string[];
  requirement?: string;
  multipleTags?: boolean;
  keywordsIncluded?: string[];
  missingKeywords?: string[];
  toMuchKeywords?: string[];
  forbiddenCharacters?: string[];
  isError: boolean;
}

export interface MetaNameTagsProps {
  content?: string;
  forbiddenCharacters?: string[];
  status?: string;
  isError: boolean;
}

export type MetaNameWithProps = {
  [metaName in string]?: MetaNameTagsProps;
};

export interface AdvancedTagsWithReason {
  tagAmount: number;
  listOfFoundMeta?: MetaNameWithProps;
  isError: boolean;
}

export interface CombineTagsWithReason extends TagsWithReason, AdvancedTagsWithReason {}

export type TagsPatterns = Record<string, Record<AllTagsName, TagsWithReason>>;

export type AdvancedTagsPatterns = Record<
  string,
  Record<AdvancedTagsNameType, AdvancedTagsWithReason>
>;

export type CombinedPatterns = {
  [key: string]:
    | { [tag in BasicTagsName]: TagsWithReason }
    | { [tag in AdvancedTagsNameType]?: AdvancedTagsWithReason };
};
