import {
  ConfigFile,
  EXTENDED_ADVANCED_ANALYZER_GLOBAL_CONFIG_FILE,
  EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE,
  EXTENDED_DUPLICATED_ANALYZER_CONFIG_FILE,
  EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE,
  GLOBAL_CONFIG_FILE,
  initConfig,
  message,
  readConfig,
} from "@landing-friend/core";
import inquirer from "inquirer";

export const configInit = async () => {
  const config = readConfig("landing-friend-config.ts", "init");
  if (config) {
    message("Config already exists", "red");
    return;
  }

  let extendResponseBySitemap: typeof EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE = {};
  let extendResponseByAnalyzer: typeof EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE = {};
  let extendResponseByAdvanceAnalyzer: typeof EXTENDED_ADVANCED_ANALYZER_GLOBAL_CONFIG_FILE = {};
  let extendResponseByDuplicatedAnalyzer: typeof EXTENDED_DUPLICATED_ANALYZER_CONFIG_FILE = {};

  const directories: ConfigFile = await inquirer.prompt([
    {
      type: "input",
      name: "domain",
      message: "Domain of your website",
      default: GLOBAL_CONFIG_FILE.domain,
    },
    {
      type: "input",
      name: "input",
      message: "Folder directory with your html files:",
      default: GLOBAL_CONFIG_FILE.input,
    },
    {
      type: "input",
      name: "output",
      message: "Folder directory to output files:",
      default: GLOBAL_CONFIG_FILE.output,
    },
    {
      type: "confirm",
      name: "robots",
      message: "Do you want generate robots.txt:",
      default: GLOBAL_CONFIG_FILE.robots,
    },
    {
      type: "input",
      name: "excludedPage",
      message: "File paths to exclude:",
      default: GLOBAL_CONFIG_FILE.excludedPage,
    },
  ]);

  const { extendConfigBySitemap } = await inquirer.prompt<{
    extendConfigBySitemap: boolean;
  }>({
    type: "confirm",
    name: "extendConfigBySitemap",
    message: "Does your website have localized pages?",
    default: true,
  });

  if (extendConfigBySitemap) {
    extendResponseBySitemap = await inquirer.prompt([
      {
        type: "input",
        name: "sitemap.locale.defaultLocale",
        message: "Default locale of your website:",
        default: EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE.sitemap?.locale?.defaultLocale,
      },
      {
        type: "input",
        name: "sitemap.locale.localeWildcard",
        message: "The position of the locale in the path:",
        default: EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE.sitemap?.locale?.localeWildcard,
      },
      {
        type: "list",
        name: "sitemap.sortBy",
        message: "Select a sitemap sorting method:",
        default: EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE.sitemap?.sortBy,
        choices: ["priority", "alphabetically-asc", "alphabetically-desc"],
      },
      {
        type: "confirm",
        name: "sitemap.trailingSlash",
        message: `Whether to add "/" at the end of the url ?`,
        default: EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE.sitemap?.trailingSlash,
      },
    ]);
  }

  const { extendConfigByAnalyzer } = await inquirer.prompt<{
    extendConfigByAnalyzer: boolean;
  }>({
    type: "confirm",
    name: "extendConfigByAnalyzer",
    message: "Do you want to extend config by analyzer?",
    default: true,
  });

  if (extendConfigByAnalyzer) {
    extendResponseByAnalyzer = await inquirer.prompt([
      {
        type: "number",
        name: "analyzer.h1.minLength",
        message: "Enter minimum length for h1:",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "h1" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.h1.minLength,
      },
      {
        type: "number",
        name: "analyzer.h1.maxLength",
        message: "Enter maximum length for h1:",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "h1" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.h1.maxLength,
      },
      {
        type: "number",
        name: "analyzer.title.minLength",
        message: "Enter minimum length for title:",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "title" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.title.minLength,
      },
      {
        type: "number",
        name: "analyzer.title.maxLength",
        message: "Enter maximum length for title:",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "title" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.title.maxLength,
      },
      {
        type: "number",
        name: "analyzer.description.minLength",
        message: "Enter minimum length for description:",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "description" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.description.minLength,
      },
      {
        type: "number",
        name: "analyzer.description.maxLength",
        message: "Enter maximum length for description:",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "description" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.description.maxLength,
      },
      {
        type: "confirm",
        name: "analyzer.keywords.count",
        message: "Do you want to count keywords?",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "keywords" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.keywords.count,
      },
      {
        type: "confirm",
        name: "analyzer.canonical.count",
        message: "Do you want to check your canonical links?",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "keywords" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.canonical.count,
      },
      {
        type: "confirm",
        name: "analyzer.lastSentence.count",
        message: "Do you want to check for matching keywords in last the div?",
        default:
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer instanceof Object &&
          "lastSentence" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer &&
          EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.lastSentence.count,
      },
    ]);
    const { extendAdvanceAnalyzer } = await inquirer.prompt<{
      extendAdvanceAnalyzer: boolean;
    }>({
      type: "confirm",
      name: "extendAdvanceAnalyzer",
      message: "Do you want to enable advance analyzer?",
      default: true,
    });

    if (extendAdvanceAnalyzer) {
      extendResponseByAdvanceAnalyzer = await inquirer.prompt([
        {
          type: "confirm",
          name: "advancedAnalyzer.og",
          message: "Do you want to check all og protocols?",
          default: EXTENDED_ADVANCED_ANALYZER_GLOBAL_CONFIG_FILE.advancedAnalyzer?.og,
        },
        {
          type: "confirm",
          name: "advancedAnalyzer.twitter",
          message: "Do you want to check all twitter metadata?",
          default: EXTENDED_ADVANCED_ANALYZER_GLOBAL_CONFIG_FILE.advancedAnalyzer?.twitter,
        },
      ]);
    }
  }

  extendResponseByDuplicatedAnalyzer = await inquirer.prompt({
    type: "confirm",
    name: "searchDuplicated",
    message: "Do you want to search for duplicated pages and content?",
    default: EXTENDED_DUPLICATED_ANALYZER_CONFIG_FILE.searchDuplicated,
  });

  const completeConfig: ConfigFile = {
    ...directories,
    ...extendResponseBySitemap,
    ...extendResponseByAnalyzer,
    ...extendResponseByAdvanceAnalyzer,
    ...extendResponseByDuplicatedAnalyzer,
  };
  await initConfig(completeConfig);
};
