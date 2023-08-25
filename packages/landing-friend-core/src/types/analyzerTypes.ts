export type AdvancedTagsName = "og" | "twitter";

export type TagsName = "h1" | "title" | "description";

export type AdditionalTagsName = "lastSentence" | "keywords";

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
  countKeywords?: boolean;
  countWordsInLast?: boolean;
  content?: string;
  requirement?: string;
  multipleTags?: boolean;
  keywordsIncluded?: string[];
  forbiddenCharacters?: string[];
}

export interface MetaNameTagsProps {
  content?: string;
  forbiddenCharacters?: string[];
}

export type MetaNameWithProps = {
  [metaName in AdditionalTagsName]?: MetaNameTagsProps;
};

export interface AdvancedTagsWithReason {
  tagAmount: number;
  listOfFoundMeta?: MetaNameWithProps;
}

export interface CombineTagsWithReason
  extends TagsWithReason,
    AdvancedTagsWithReason {}

export type TagsPatterns = Record<string, Record<AllTagsName, TagsWithReason>>;

export type AdvancedTagsPatterns = Record<
  string,
  Record<AdvancedTagsName, AdvancedTagsWithReason>
>;

export type CombinedPatterns = {
  [key: string]:
    | {
        [tag in BasicTagsName]: TagsWithReason;
      }
    | {
        [tag in AdvancedTagsName]?: AdvancedTagsWithReason;
      };
};
