// #!/usr/bin/env node
import {
  message,
  readConfig,
  searchDuplicated,
  sitemapGenerator,
  websiteAnalyzer,
} from "@landing-friend/core";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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
    async () => {
      console.clear();
      await configInit();
    }
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
      console.clear();
      const config = readConfig("landing-friend-config.ts", "generate");
      if (config) {
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
    }
  )
  //!!!!!!!
  // USE IT INSTEAD OF BELOW COMMAND IF U WANT CONSOLE.LOG SOMETHING
  //
  //   .command(
  //     "analyze",
  //     "Analyze your landing page",
  //     {
  //       help: {
  //         describe:
  //           "Analysis of your website through defined values in the config generates HTML and JSON files.",
  //       },
  //     },
  //     async () => {
  // console.clear();
  //       const config = readConfig("landing-friend-config.ts");
  //       if (!config) {
  //         message("Config not found", "red");
  //         return;
  //       }
  //       try {
  //         message("Analyzing your page...", "yellow");
  //         await websiteAnalyzer(config);
  //       } catch (e) {
  //         const error = e as Error;
  //         message(error.message, "red");
  //         return;
  //       } finally {
  //         process.exit();
  //       }
  //     }
  //   )
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
      console.clear();
      const config = readConfig("landing-friend-config.ts", "generate");
      if (!config) {
        message(
          "No config detected. Please create one using init command or create it manually",
          "red"
        );
        return;
      }

      const char = ".";
      const maxChar = 3;
      let progress = "";
      const interval = setInterval(() => {
        if (progress.length < maxChar) {
          progress += char;
          console.clear();
          message(`Analyzing your page${progress}`, "yellow");
        } else progress = "";
      }, 500);

      try {
        await websiteAnalyzer(config, interval);
      } catch (e) {
        const error = e as Error;
        message(error.message, "red");
        return;
      } finally {
        process.exit();
      }
    }
  )
  //!!!!!!!
  // USE IT INSTEAD OF BELOW COMMAND IF U WANT CONSOLE.LOG SOMETHING
  //
  .command(
    "duplicated",
    "Find duplicated content",
    {
      help: {
        describe: "Search the out file to find duplicated content on your site.",
      },
    },
    async () => {
      console.clear();
      const config = readConfig("landing-friend-config.ts", "generate");
      if (!config) {
        message(
          "No config detected. Please create one using init command or create it manually",
          "red"
        );
        return;
      }

      try {
        message("Searching for duplicates...", "yellow");
        await searchDuplicated(config);
      } catch (e) {
        const error = e as Error;
        message(error.message, "red");
        return;
      } finally {
        process.exit();
      }
    }
  )
  // .command(
  //   "duplicated",
  //   "Find duplicated content",
  //   {
  //     help: {
  //       describe: "Search the out file to find duplicated content on your site.",
  //     },
  //   },
  //   async () => {
  // console.clear();
  //     const config = readConfig("landing-friend-config.ts", "generate");
  //     if (!config) {
  //       message(
  //         "No config detected. Please create one using init command or create it manually",
  //         "red"
  //       );
  //       return;
  //     }

  //     const char = ".";
  //     const maxChar = 3;
  //     let progress = "";
  //     const interval = setInterval(() => {
  //       if (progress.length < maxChar) {
  //         progress += char;
  //         console.clear();
  //         message(`Searching for duplicates${progress}`, "yellow");
  //       } else progress = "";
  //     }, 500);

  //     try {
  //       await searchDuplicated(config, interval);
  //     } catch (e) {
  //       const error = e as Error;
  //       message(error.message, "red");
  //       return;
  //     } finally {
  //       process.exit();
  //     }
  //   }
  // )
  .help()
  .showHelpOnFail(true)
  .strict()
  .strictCommands()
  .demandCommand()
  .parse();
