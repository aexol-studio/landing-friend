import {
  GLOBAL_CONFIG_FILE,
  initConfig,
  message,
  readConfig,
} from "@landing-friend/core";
import inquirer from "inquirer";

export const configInit = async () => {
  const config = readConfig("landing-friend-config.ts");
  if (config) {
    message("Config already exists", "red");
    return;
  }
  const directories = await inquirer.prompt<{
    domain: string;
    in: string;
    out: string;
  }>([
    {
      type: "input",
      name: "domain",
      message: "Domain of your website",
      default: GLOBAL_CONFIG_FILE.domain,
    },
    {
      type: "input",
      name: "in",
      message: "Folder directory with your html files",
      default: GLOBAL_CONFIG_FILE.input,
    },
    {
      type: "input",
      name: "out",
      message: "Folder directory to output sitemap.xml",
      default: GLOBAL_CONFIG_FILE.output,
    },
  ]);
  await initConfig({
    domain: directories.domain,
    input: directories.in,
    output: directories.out,
  });
};
