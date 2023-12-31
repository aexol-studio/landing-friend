import ISO from "iso-639-1";

import {
  ConfigFile,
  getHtmlFiles,
  matchedSetting,
  messageWithContent,
  saveOldSitemap,
  saveSitemap,
} from "./index.js";

type File = {
  link: string;
  priority: number;
};

type LocaleFile = {
  links: {
    link: string;
    locale: string;
  }[];
  priority: number;
};

export const sitemapGenerator = (config: ConfigFile) => {
  const { domain, input, output, sitemap, excludedPage } = config;

  const generateSitemap = () => {
    const allHtmlFiles = getHtmlFiles(input, true);
    const allLocales = ISO.getAllCodes();

    const isThereAnyLocale = allLocales.some(locale =>
      allHtmlFiles.some(file => {
        const regexPattern = new RegExp(`^/${locale}/`);
        return file.match(regexPattern);
      })
    );

    messageWithContent("Detected locales: ", `${isThereAnyLocale}`, "yellow");

    const preparedFiles: File[] = allHtmlFiles
      .map(file => {
        const fileWithoutIndex = file.replace(/index/g, "").replace(/\/$/g, "");
        const fileNameWithSlash = file.includes("index") ? file : file + "/";

        const rest = sitemap?.trailingSlash ? fileWithoutIndex + "/" : fileWithoutIndex;

        const priority = Math.max(
          0.1,
          1 - (fileNameWithSlash.replace(/^\//g, "").match(/\//g) || []).length * 0.1
        );

        if (!matchedSetting(fileWithoutIndex, excludedPage)) {
          return {
            link: `${domain}${rest}`,
            priority: priority,
          };
        }
      })
      .filter((file): file is File => !!file);

    const files = preparedFiles.sort((a, b) => {
      if (sitemap?.sortBy === "priority") {
        return b.priority - a.priority;
      } else if (sitemap?.sortBy === "alphabetically-asc") {
        return a.link.localeCompare(b.link);
      } else if (sitemap?.sortBy === "alphabetically-desc") {
        return b.link.localeCompare(a.link);
      }
      return 0;
    });

    let sitemapXML: string;
    if (sitemap?.locale?.localeWildcard && sitemap?.locale?.defaultLocale && isThereAnyLocale) {
      sitemapXML = localesSitemapGenerator({
        ...sitemap.locale,
        files,
      });
    } else {
      sitemapXML = classicSitemapGenerator({ files });
    }

    saveOldSitemap(`${output}/sitemap.xml`, "./SEO");
    saveSitemap(`${output}/sitemap.xml`, sitemapXML);
  };

  const generateRobots = () => {
    const excludedPages = excludedPage
      .map(path => {
        if (!path.startsWith("/") && !path.startsWith("*/")) {
          path = "/" + path.replace(new RegExp("^./", "g"), "");
        }
        return `Disallow: ${path}`;
      })
      .join("\n");

    const robotsTXT = `Sitemap: ${domain}/sitemap.xml\n\nUser-agent: *\n${excludedPages}`;

    saveSitemap(`${output}/robots.txt`, robotsTXT);
  };

  const generateAll = () => {
    generateSitemap();
    generateRobots();
  };

  return {
    generateAll,
    generateSitemap,
    generateRobots,
  };
};

const localesSitemapGenerator = ({
  files,
  defaultLocale,
  localeWildcard,
}: {
  files: File[];
  defaultLocale: string;
  localeWildcard: string;
}) => {
  const allLocales = ISO.getAllCodes();

  const locales: string[] = [];
  allLocales.forEach(locale => {
    const replaced = localeWildcard.replace("$locale", locale);
    files.forEach(file => {
      const url = new URL(file.link);
      const findLocales = url.pathname.match(replaced);
      if (findLocales && !locales.includes(locale)) locales.push(locale);
    });
  });

  if (!locales.includes(defaultLocale)) locales.push(defaultLocale.toLowerCase());

  const pagesWithLocales = files.filter(file => {
    return locales.some(locale => file.link.includes(`/${locale}/`));
  });

  const classicSitemapFiles = files.filter(
    file => !locales.some(locale => file.link.includes(`/${locale}/`))
  );

  const preparedFiles = pagesWithLocales
    .map(page => {
      const url = new URL(page.link);
      const locale = url.pathname.split("/")[1];
      const link = page.link.replace(`/${locale}/`, "/__locale__/");
      return {
        link,
        priority: page.priority,
      };
    })
    .filter((file, index, self) => index === self.findIndex(t => t.link === file.link));

  const newFiles = preparedFiles.reduce((acc, file) => {
    const split = file.link.split("/__locale__/");
    if (split.length === 2) {
      const link = file.link;
      const priority = file.priority;
      acc[link] = locales.map(locale => {
        const newLink = link.replace("/__locale__/", `/${locale}/`);
        return {
          link: newLink,
          priority,
          locale,
        };
      });
    }
    return acc;
  }, {} as Record<string, (File & { locale: string })[]>);

  const localeSitemapFiles = Object.keys(newFiles)
    .map(key => {
      if (!key.includes("__locale__")) return null;
      const links = newFiles[key].map(file => ({
        link: file.link,
        locale: file.locale,
      }));
      const priority = newFiles[key][0].priority;
      return {
        [key.replace("/__locale__", "")]: {
          links,
          priority,
        },
      };
    })
    .filter((file): file is Record<string, LocaleFile> => !!file);

  return `
<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${localeSeoGenerator(
    classicSitemapFiles,
    localeSitemapFiles,
    defaultLocale
  )}
  </urlset>
`.trim();
};

const classicSitemapGenerator = ({ files }: { files: File[] }) => {
  return `
<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${classicSeoFragmentGenerator(files)}
  </urlset>
`.trim();
};

const localeSeoGenerator = (
  classicSitemapFiles: File[],
  localeSitemapFiles: Array<Record<string, LocaleFile>>,
  defaultLocale: string
) => {
  const classicWithoutLocales: File[] = classicSitemapFiles.filter(classic => {
    return !localeSitemapFiles.some(locale => classic.link === Object.keys(locale)[0]);
  });

  const data = localeSitemapFiles.map(page => {
    const key = Object.keys(page)[0];
    const links = page[key].links;
    const priority = page[key].priority;

    return links
      .map(({ locale: mainLocale, link: linkToKey }) => {
        const replaced = linkToKey.replace(`/${mainLocale}`, "");
        return `
      <url>
      <loc>${defaultLocale === mainLocale ? replaced : linkToKey}</loc>${links
          .map(({ locale, link }) => {
            const replaced = link.replace(`/${locale}`, "");
            return defaultLocale === locale
              ? `
          <xhtml:link rel="alternate" hreflang="${locale}" href="${replaced}"/>`
              : `
          <xhtml:link rel="alternate" hreflang="${locale}" href="${link}"/>`;
          })
          .join("")}
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>${(priority + 0.1).toFixed(1)}</priority>
        </url>`;
      })
      .join("");
  });
  return data.join("").concat(classicSeoFragmentGenerator(classicWithoutLocales));
};

const classicSeoFragmentGenerator = (preparedFiles: File[]) => {
  return preparedFiles
    .map(
      page => `
    <url>
      <loc>${page.link}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>${page.priority.toFixed(1)}</priority>
    </url>`
    )
    .join("");
};
