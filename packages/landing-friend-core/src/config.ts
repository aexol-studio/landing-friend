import fs from "fs";
import { message } from "./console.js";
import { LanguageCode } from "iso-639-1";
import ts from "typescript";

type WildcardSettings = { priority?: number; exclude?: boolean };

type SitemapSettings = {
  locale?: {
    defaultLocale: LanguageCode;
    localeWildcard: string;
  };
  trailingSlash?: boolean;
  sortBy?: "priority" | "alphabetically-asc" | "alphabetically-desc";
  settingsPerWildcard?: Record<string, WildcardSettings>;
};

export type ConfigFile = {
  domain: string;
  input: string;
  output: string;
  sitemap?: SitemapSettings;
  robots?: boolean;
  analyzer?: {
    saveAs: "json" | "html";
    tags: Record<
      string,
      { minLength?: number; maxLength?: number; content?: boolean }
    >;
  };
};
export const GLOBAL_CONFIG_FILE: ConfigFile = {
  domain: "https://www.example.com",
  input: "./out/",
  output: "./public/",
};

export const readConfig = (filePath: string): ConfigFile | undefined => {
  if (!fs.existsSync(filePath)) {
    message(
      "No config detected. Please create one using init command or create it manually",
      "red"
    );
    return undefined;
  }

  try {
    const configFileText = fs
      .readFileSync(filePath, "utf8")
      .replace(`import { ConfigFile } from "@landing-friend/core";`, "")
      .replace("export const GLOBAL_CONFIG_FILE: ConfigFile = ", "")
      .replace(";", "")
      .trim();

    const config = ts.parseConfigFileTextToJson(filePath, configFileText)
      .config as ConfigFile;

    const errors: string[] = [];
    Object.keys(GLOBAL_CONFIG_FILE).forEach((key) => {
      const v = config[key as keyof ConfigFile];
      if (typeof v === "undefined" || v === null) {
        errors.push(
          `Invalid config file. Please include "${key}" in your config`
        );
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
    message(
      "In directory was not present. It was created automatically",
      "yellow"
    );
  }
  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output, { recursive: true });
    message(
      "Out directory was not present. It was created automatically",
      "yellow"
    );
  }
};
export const initConfig = async (values: ConfigFile = GLOBAL_CONFIG_FILE) => {
  const formattedConfig = `import { ConfigFile } from "@landing-friend/core";

export const GLOBAL_CONFIG_FILE: ConfigFile = {
  ${Object.entries(values)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(",\n  ")}
};`;

  fs.writeFileSync("landing-friend-config.ts", formattedConfig);
};
