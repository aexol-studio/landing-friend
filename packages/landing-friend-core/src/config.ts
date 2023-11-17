import fs from "fs";
import ts from "typescript";

import { message } from "./console.js";
import { ConfigFile } from "./index.js";

export const GLOBAL_CONFIG_FILE: ConfigFile = {
  domain: "https://www.example.com",
  input: "./out",
  output: "./out",
  robots: true,
  excludedPage: ["*/404/"],
};
export const EXTENDED_SITEMAP_GLOBAL_CONFIG_FILE: Pick<ConfigFile, "sitemap"> = {
  sitemap: {
    locale: {
      defaultLocale: "en",
      localeWildcard: "/$locale/",
    },
    sortBy: "priority",
    trailingSlash: true,
  },
};
export const EXTENDED_ANALYZER_GLOBAL_CONFIG_FILE: Pick<ConfigFile, "analyzer"> = {
  analyzer: {
    h1: {
      minLength: 10,
      maxLength: 100,
    },
    title: {
      minLength: 10,
      maxLength: 60,
    },
    description: {
      maxLength: 160,
      minLength: 120,
    },
    lastSentence: { count: true },
    keywords: { count: true },
    canonical: { count: true },
  },
};
export const EXTENDED_ADVANCED_ANALYZER_GLOBAL_CONFIG_FILE: Pick<ConfigFile, "advancedAnalyzer"> = {
  advancedAnalyzer: {
    og: true,
    twitter: true,
  },
};

export const EXTENDED_DUPLICATED_ANALYZER_CONFIG_FILE: Pick<ConfigFile, "searchDuplicated"> = {
  searchDuplicated: true,
};

export const readConfig = (filePath: string, option: "init" | "generate") => {
  if (!fs.existsSync(filePath)) {
    if (option === "generate") {
      message(
        "No config detected. Please create one using init command or create it manually",
        "red"
      );
    }
    return undefined;
  }

  try {
    const configFileText = fs
      .readFileSync(filePath, "utf8")
      .replace(/`/g, `"`)
      .replace(`import { ConfigFile } from "@landing-friend/core";`, "")
      .replace("export const GLOBAL_CONFIG_FILE: ConfigFile = ", "")
      .replace(";", "")
      .trim();

    const config = ts.parseConfigFileTextToJson(filePath, configFileText).config as ConfigFile;

    const errors: string[] = [];
    Object.keys(GLOBAL_CONFIG_FILE).forEach(key => {
      const v = config[key as keyof ConfigFile];
      if (typeof v === "undefined" || v === null) {
        errors.push(`Invalid config file. Please include "${key}" in your config`);
      }
    });

    if (errors.length > 0) {
      message(errors.join("\n"), "red");
      return undefined;
    }

    return config;
  } catch (error) {
    message("Error while reading or parsing the config file.", "red");
    console.error(error);
    return undefined;
  }
};

export const checkConfigDirectories = async (config: ConfigFile) => {
  if (!fs.existsSync(config.input)) {
    fs.mkdirSync(config.input, { recursive: true });
    message("In directory was not present. It was created automatically", "yellow");
  }
  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output, { recursive: true });
    message("Out directory was not present. It was created automatically", "yellow");
  }
};

export const initConfig = async (values: ConfigFile = GLOBAL_CONFIG_FILE) => {
  const formattedConfig = `import { ConfigFile } from "@landing-friend/core";

export const GLOBAL_CONFIG_FILE: ConfigFile = {
${Object.entries(values)
  .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
  .join(",\n  ")}
};`;

  fs.writeFileSync("landing-friend-config.ts", formattedConfig);
};
