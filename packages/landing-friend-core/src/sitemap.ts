import { ConfigFile } from "./config.js";
import { getHtmlFiles, saveFile } from "./utils.js";
import ISO from "iso-639-1";

export const sitemapGenerator = (config: ConfigFile) => {
  const { domain, input, output, sitemap } = config;

  const generateSitemap = async () => {
    const allHtmlFiles = getHtmlFiles(input, input);

    const excludedPages = Object.keys(
      config.sitemap?.settingsPerWildcard || {}
    );

    const sitemapXML = sitemap?.locale?.localeWildcard
      ? localesSitemapGenerator({
          allHtmlFiles,
          excludedPages,
          domain,
          defaultLocale: sitemap.locale.defaultLocale,
          localeWildcard: sitemap.locale.localeWildcard,
        })
      : classicSitemapGenerator({
          allHtmlFiles,
          excludedPages,
          domain,
        });

    saveFile(`${output}/sitemap.xml`, sitemapXML);
  };

  const generateRobots = async () => {
    const excludedPages = Object.keys(
      config.sitemap?.settingsPerWildcard || {}
    );

    const robotsTXT = `Sitemap: ${domain}/sitemap.xml\n\nUser-agent: *${excludedPages
      .map((page) => `Disallow: /${page}`)
      .join("\n")}`;

    saveFile(`${output}/robots.txt`, robotsTXT);
  };

  return {
    generateSitemap,
    generateRobots,
  };
};

const localesSitemapGenerator = ({
  allHtmlFiles,
  excludedPages,
  domain,
  defaultLocale,
  localeWildcard,
}: {
  allHtmlFiles: string[];
  excludedPages: string[];
  domain: string;
  defaultLocale: string;
  localeWildcard: string;
}) => {
  const allLocales = ISO.getAllCodes();

  const locales = allLocales
    .map((locale) =>
      allHtmlFiles.some((file) =>
        file.includes(localeWildcard.replace("/$locale", locale))
      )
        ? locale
        : null
    )
    .filter((locale) => locale !== null) as string[];

  const _pagesWithLocales = allHtmlFiles.filter((file) =>
    locales.some((locale) => file.includes(`${locale}/`))
  );

  const _pagesWithDefaultLocale = allHtmlFiles.filter((file) =>
    file.includes(`${defaultLocale}/`)
  );

  const _pagesWithoutLocales = allHtmlFiles.filter(
    (file) =>
      !_pagesWithLocales.includes(file) &&
      !_pagesWithDefaultLocale.includes(file) &&
      locales.every((locale) => !file.includes(locale)) &&
      !file.includes("locale")
  );

  const pagesWithLocales = [...new Set(_pagesWithLocales).values()]
    .map((file) => {
      return {
        link: file,
        priority: Math.max(0.1, 1 - (file.match(/\//g) || []).length * 0.1),
      };
    })
    .filter((name) => !excludedPages.includes(name.link.replace("/", "")));

  const pagesWithDefaultLocale = [...new Set(_pagesWithDefaultLocale).values()]
    .map((file) => {
      return {
        link: file.replace(`${defaultLocale}/`, ""),
        priority: Math.max(0.1, 1 - (file.match(/\//g) || []).length * 0.1),
      };
    })
    .filter((name) => !excludedPages.includes(name.link.replace("/", "")));

  const pagesWithoutLocales = [...new Set(_pagesWithoutLocales).values()]
    .map((file) => {
      return {
        link: file,
        priority: Math.max(0.1, 1 - (file.match(/\//g) || []).length * 0.1),
      };
    })
    .filter((name) => !excludedPages.includes(name.link.replace("/", "")));

  return `
<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${localeSeoGenerator(
    domain,
    pagesWithDefaultLocale,
    pagesWithLocales,
    locales,
    defaultLocale
  )}${classicSeoFragmentGenerator(domain, pagesWithoutLocales)}
  </urlset>
`;
};

const classicSitemapGenerator = ({
  allHtmlFiles,
  excludedPages,
  domain,
}: {
  allHtmlFiles: string[];
  excludedPages: string[];
  domain: string;
}) => {
  const pages = allHtmlFiles
    .map((file) => {
      return {
        link: file,
        priority: Math.max(0.1, 1 - (file.match(/\//g) || []).length * 0.1),
      };
    })
    .filter((name) => !excludedPages.includes(name.link.replace("/", "")));

  return `
<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${classicSeoFragmentGenerator(
    domain,
    pages
  )}</urlset>
`;
};

const localeSeoGenerator = (
  domain: string,
  pagesWithDefaultLocale: {
    link: string;
    priority: number;
  }[],
  pagesWithLocales: {
    link: string;
    priority: number;
  }[],
  locales: string[],
  defaultLocale: string
) => {
  return pagesWithDefaultLocale
    .map(
      (page) => `
    <url>
      <loc>${domain}/${page.link}</loc>${localeSeoFragmentGenerator(
        domain,
        page,
        defaultLocale,
        locales
      )}
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join("");
};

const localeSeoFragmentGenerator = (
  domain: string,
  page: {
    link: string;
    priority: number;
  },
  currentLocale: string,
  locales: string[]
) => {
  return locales
    .sort((a) => (a === currentLocale ? 1 : -1))
    .map((locale) =>
      locale !== currentLocale
        ? `
      <xhtml:link rel="alternate" hreflang="${locale}" href="${domain}/${locale}/${page.link}"/>`
        : `
      <xhtml:link rel="alternate" hreflang="${locale}" href="${domain}/${page.link}"/>`
    )
    .join("");
};

const classicSeoFragmentGenerator = (
  domain: string,
  pages: {
    link: string;
    priority: number;
  }[]
) =>
  pages
    .map(
      (page) => `
    <url>
      <loc>${domain}/${page.link}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join("");
