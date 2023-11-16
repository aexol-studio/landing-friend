# Landing Friend

Landing friend is a simple to use CLI tool which offers immense help for on-page SEO specialists. Run a couple simple commands you`ll get:
* sitemap.xml - localized or unlocalized depending on your project settings
* robots.txt - based on the pages you set up as excluded
* detailed SEO analysis (meta tags, keyword population, errors & duplicates)
* detailed website error analysis (missing elements, duplicate pages, 404s, broken links etc.)

## Installation

First to install globally run: `npm i -g @landing-friend/cli@latest`  
then to install it locally run: `npm i -D @landing-friend/core@latest`

## Initialization

After installing run `lf init` to initialize config generation. You will be asked about:
* the main domain address of your website
* path to your html files (default: /out)
* path to output folder for sitemap & robots (default: /out)
* if you want a robots.txt file generated
* which paths you want exclude from the sitemap and add to robots.txt (eg. /login or /register)
* if your website has localized pages
* default locale of your website (default: en)
* position of the locale tag in the path (default: /$locale/)
* sitemap sorting method (by priority or alphabetically)
* trailing slashes usage in the project (y/n)
* if you want to use the advanced analyzer
* desired lengths of basic meta tags
* if you want to match & count keywords in h1, title, metadesc and last sentence

## Generate sitemap

Simply run `lf generate` and landing friend will create a sitemap.xml file in your designated path according to the config and also make a robots.txt file based on the excluded paths. Your old sitemap and robots files (if they exist) will be moved to a /seo folder.

## Analyze seo & project structure

Run `lf analyze` and landing friend will generate a detailed seo & project structure report in both .json and .html format - automatically opening it for you to streamline the error-fixing process.

---
### Project is undergoing rapid development and the above will probably change
--- 
