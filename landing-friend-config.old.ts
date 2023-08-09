import { ConfigFile } from "@landing-friend/core";

export const GLOBAL_CONFIG_FILE: ConfigFile = {
  domain: "https://www.example.com",
  input: "./out/",
  output: "./out/",
  robots: true,
  sitemap: {"locale":{"defaultLocale":"en","localeWildcard":"/$locale/"},"sortBy":"priority","trailingSlash":true,"settingsPerWildcard":{"404":{"exclude":true},"/assets/*":{"exclude":true}}},
  analyzer: {"tags":{"keywords":{"countKeywords":true},"h1":{"minLength":10,"maxLength":70},"title":{"minLength":10,"maxLength":70},"description":{"minLength":50,"maxLength":200}}}
};