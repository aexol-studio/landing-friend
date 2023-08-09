import {
  GLOBAL_CONFIG_FILE,
  EXTENDED_ROBOTS_GLOBAL_CONFIG_FILE,
  EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE,
  EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE,
  initConfig,
  message,
  readConfig,
  ConfigFile,
} from "@landing-friend/core";
import inquirer from "inquirer";

export const configInit = async () => {
  const config = await readConfig("landing-friend-config.ts");
  if (config) {
    message("Config already exists", "red");
    return;
  }

  const directories = await inquirer.prompt<{
    domain: string;
    input: string;
    output: string;
  }>([
    {
      type: "input",
      name: "domain",
      message: "Domain of your website",
      default: GLOBAL_CONFIG_FILE.domain,
    },
    {
      type: "input",
      name: "input",
      message: "Folder directory with your html files",
      default: GLOBAL_CONFIG_FILE.input,
    },
    {
      type: "input",
      name: "output",
      message: "Folder directory to output files",
      default: GLOBAL_CONFIG_FILE.output,
    },
  ]);
  let extendResponseByRobots: Pick<ConfigFile, "robots"> = {};
  let extendResponseBySitemap: Pick<ConfigFile, "sitemap"> = {};
  let extendResponseByAnalyzer: Pick<ConfigFile, "analyzer"> = {};
  const { extendConfigBySitemap } = await inquirer.prompt<{
    extendConfigBySitemap: boolean;
  }>({
    type: "confirm",
    name: "extendConfigBySitemap",
    message: "Do you want to extend config by sitemap?",
    default: true,
  });

  extendResponseByRobots = await inquirer.prompt({
    type: "confirm",
    name: "robots",
    message: "Do you want generate robots.txt",
    default: EXTENDED_ROBOTS_GLOBAL_CONFIG_FILE.robots,
  });

  if (extendConfigBySitemap) {
    extendResponseBySitemap = await inquirer.prompt([
      {
        type: "input",
        name: "sitemap.locale.defaultLocale",
        message: "Default locale of your website",
        default:
          EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE?.sitemap?.locale?.defaultLocale,
      },
      {
        type: "input",
        name: "sitemap.locale.localeWildcard",
        message: "The position of the locale in the path",
        default:
          EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE?.sitemap?.locale?.localeWildcard,
      },
      {
        type: "list",
        name: "sitemap.sortBy",
        message: "Select a sitemap sorting method",
        default: EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE?.sitemap?.sortBy,
        choices: ["priority", "alphabetically-asc", "alphabetically-desc"],
      },
      {
        type: "confirm",
        name: "sitemap.trailingSlash",
        message: "Whether to add / at the end of the url ?",
        default: EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE?.sitemap?.trailingSlash,
      },
      {
        type: "input",
        name: "sitemap.settingsPerWildcard",
        message: "Settings for specific wildcards such as exclusion/priority",
        default: JSON.stringify(
          EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE?.sitemap?.settingsPerWildcard
        ),
      },
    ]);

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
          type: "confirm",
          name: "analyzer.tags.keywords.countKeywords",
          message: "Do you want to count keywords?",
          default:
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE?.analyzer?.tags instanceof
              Object &&
            "keywords" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags &&
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags.keywords
              .countKeywords,
        },
        {
          type: "number",
          name: "analyzer.tags.h1.minLength",
          message: "Enter minimum length for h1:",
          default:
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE?.analyzer?.tags instanceof
              Object &&
            "h1" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags &&
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags.h1.minLength,
        },
        {
          type: "number",
          name: "analyzer.tags.h1.maxLength",
          message: "Enter maximum length for h1:",
          default:
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE?.analyzer?.tags instanceof
              Object &&
            "h1" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags &&
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags.h1.maxLength,
        },
        {
          type: "number",
          name: "analyzer.tags.title.minLength",
          message: "Enter minimum length for title:",
          default:
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE?.analyzer?.tags instanceof
              Object &&
            "title" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags &&
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags.title.minLength,
        },
        {
          type: "number",
          name: "analyzer.tags.title.maxLength",
          message: "Enter maximum length for title:",
          default:
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE?.analyzer?.tags instanceof
              Object &&
            "title" in EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags &&
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags.title.maxLength,
        },
        {
          type: "number",
          name: "analyzer.tags.description.minLength",
          message: "Enter minimum length for description:",
          default:
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE?.analyzer?.tags instanceof
              Object &&
            "description" in
              EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags &&
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags.description
              .minLength,
        },
        {
          type: "number",
          name: "analyzer.tags.description.maxLength",
          message: "Enter maximum length for description:",
          default:
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE?.analyzer?.tags instanceof
              Object &&
            "description" in
              EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags &&
            EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE.analyzer.tags.description
              .maxLength,
        },
      ]);
    }
  }
  const completeConfig: ConfigFile = {
    ...directories,
    ...extendResponseByRobots,
    sitemap: {
      ...extendResponseBySitemap.sitemap,
      settingsPerWildcard: JSON.parse(
        JSON.parse(
          JSON.stringify(extendResponseBySitemap.sitemap?.settingsPerWildcard)
        )
      ),
    },
    ...extendResponseByAnalyzer,
  };
  await initConfig(completeConfig);
};
