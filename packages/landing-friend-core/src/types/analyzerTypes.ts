export enum AdvancedTagsName {
  og = "og",
  twitter = "twitter",
}

export type AdvancedTagsNameType = keyof typeof AdvancedTagsName;

export enum TagsName {
  h1 = "h1",
  title = "title",
  description = "description",
}

export type TagsNameType = keyof typeof TagsName;

export enum AdditionalTagsName {
  lastSentence = "lastSentence",
  keywords = "keywords",
  canonical = "canonical",
}

export type AdditionalTagsNameType = keyof typeof AdditionalTagsName;

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
