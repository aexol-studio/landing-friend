#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { message, readConfig, sitemapGenerator, websiteAnalyzer } from "@landing-friend/core";

import { configInit } from "./index.js";

process.on("SIGINT", () => {
  message("Exiting...", "redBright");
  process.exit();
});

const WelcomeMessage = "Landing Friend, Your SEO in one place.";

yargs(hideBin(process.argv))
  .usage(WelcomeMessage)
  .scriptName("landing-friend / lf")
  .command(
    "init",
    "Generate config file",
    {
      help: {
        describe:
          "It generates a configuration file containing basic or extended configuration depending on the selected options.",
      },
    },
    async () => await configInit()
  )
  .command(
    "generate",
    "Generate sitemap for your landing page",
    {
      help: {
        describe: "Generate sitemap/robots files for your page",
      },
    },
    async () => {
      const config = readConfig("landing-friend-config.ts");
      if (!config) {
        message("Config not found", "red");
        return;
      }
      try {
        message("Generating sitemap...", "yellow");
        sitemapGenerator(config).generateAll();
        message("Sitemap generated", "green");
      } catch (e) {
        const error = e as Error;
        message(error.message, "red");
        if (error.message === "There are locales in your project.") {
          return;
        }
      }
    }
  )
  .command(
    "analyze",
    "Analyze your landing page",
    {
      help: {
        describe:
          "Analysis of your website through defined values in the config generates HTML and JSON files.",
      },
    },
    async () => {
      const config = readConfig("landing-friend-config.ts");
      if (!config) {
        message("Config not found", "red");
        return;
      }
      try {
        message("Analyzing your page...", "yellow");
        await websiteAnalyzer(config);
      } catch (e) {
        const error = e as Error;
        message(error.message, "red");
        return;
      } finally {
        process.exit();
      }
    }
  )
  .help()
  .showHelpOnFail(true)
  .strict()
  .strictCommands()
  .demandCommand()
  .parse();
