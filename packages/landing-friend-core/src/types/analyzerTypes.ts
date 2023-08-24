export type AdvancedTagsName = "og" | "twitter";

export type TagsName = "h1" | "title" | "description";

export type AdditionalTagsName = "lastSentence" | "keywords";

export type BasicTagsName = TagsName | AdditionalTagsName;

export type AllTagsName = BasicTagsName | AdditionalTagsName;

export type TagsProps = Record<
  TagsName,
  {
    minLength: number;
    maxLength: number;
  }
> &
  Record<AdditionalTagsName, { count: boolean }>;

export type AdvancedTagsProps = Record<AdvancedTagsName, boolean>;

export type TagsWithReason = {
  quantity: number;
  minLength?: number;
  maxLength?: number;
  countKeywords?: boolean;
  countWordsInLast?: boolean;
  content?: string;
  requirement?: string;
  multipleTags?: boolean;
  keywordsIncluded?: string[];
  forbiddenCharacters?: string[];
};

export type AdvancedTagsWithReason = {
  tagAmount: number;
  content?: string;
  metaName?: string;
  forbiddenCharacters?: string[];
};

export type TagsPatterns = Record<string, Record<AllTagsName, TagsWithReason>>;

export type AdvancedTagsPatterns = Record<
  string,
  Record<AdvancedTagsName, AdvancedTagsWithReason>
>;

export type CombineTagsPatterns = TagsPatterns | AdvancedTagsPatterns;
