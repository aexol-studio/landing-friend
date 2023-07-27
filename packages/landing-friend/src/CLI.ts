#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { message, readConfig, sitemapGenerator } from "@landing-friend/core";

import { configInit } from "./functions/configInit.js";

process.on("SIGINT", () => {
  message("Exiting...", "redBright");
  process.exit();
});

const WelcomeMessage = `Landing Friend`;

yargs(hideBin(process.argv))
  .usage(WelcomeMessage)
  .scriptName("landing-friend")
  .command(
    "init",
    "Generate config file",
    {
      help: {
        describe: `Generate config file`,
      },
    },
    async () => await configInit()
  )
  .command(
    "generate",
    "Generate SEO for your landing page",
    {
      help: {
        describe: `Generate SEO for your landing page`,
      },
    },
    async () => {
      const config = readConfig("landing-friend-config.ts");
      if (!config) {
        message("Config not found", "red");
        return;
      }
      const { generateRobots, generateSitemap } = sitemapGenerator(config);
      message("Generating sitemap.xml ...", "yellow");
      await generateSitemap();
      message("Generating robots.txt ...", "yellow");
      await generateRobots();
    }
  )
  .help()
  .version("0.0.1")
  .showHelpOnFail(true)
  .strict()
  .strictCommands()
  .demandCommand()
  .parse();
