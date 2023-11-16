import { LanguageCode } from "iso-639-1";

import { AdvancedTagsProps, TagsProps } from "./index.js";

export type SitemapSettings = {
  locale: {
    defaultLocale: LanguageCode;
    localeWildcard: string;
  };
  trailingSlash: boolean;
  sortBy: "priority" | "alphabetically-asc" | "alphabetically-desc";
};

export type ConfigFile = {
  domain: string;
  input: string;
  output: string;
  robots: boolean;
  excludedPage: string[];
  sitemap?: SitemapSettings;
  analyzer?: TagsProps;
  advancedAnalyzer?: AdvancedTagsProps;
};
