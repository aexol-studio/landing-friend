import { ConfigFile } from "./config.js";
import { getHtmlFiles, saveFile } from "./utils.js";

export const sitemapGenerator = (config: ConfigFile) => {
  const { domain, input, output, sitemap } = config;

  const generateSitemap = async () => {
    const allHtmlFiles = getHtmlFiles(input);

    const excludedPages = Object.keys(
      config.sitemap?.settingsPerWildcard || {}
    );

    const sitemapXML = sitemap?.localeWildcard
      ? localesSitemapGenerator({
          input,
          allHtmlFiles,
          excludedPages,
          domain,
          localeWildcard: sitemap?.localeWildcard,
        })
      : classicSitemapGenerator({
          input,
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
  input,
  allHtmlFiles,
  excludedPages,
  domain,
  localeWildcard,
}: {
  input: string;
  allHtmlFiles: string[];
  excludedPages: string[];
  domain: string;
  localeWildcard: string;
}) => {
  const locales: string[] = [];
  const _pagesWithLocales = allHtmlFiles.filter((file) =>
    locales.some((locale) => file.includes(`/${locale}/`))
  );

  const _pagesWithoutLocales = allHtmlFiles.filter(
    (file) => !_pagesWithLocales.includes(file)
  );

  const pagesWithLocales = _pagesWithLocales
    .map((file) => {
      const fileName = file.replace(input, "").replace(".html", "");
      const fileNameWithSlash = fileName.includes("index")
        ? fileName
        : fileName + "/";
      return {
        link: fileNameWithSlash.replace("index", ""),
        priority: Math.max(
          0.1,
          1 - (fileNameWithSlash.match(/\//g) || []).length * 0.1
        ),
      };
    })
    .filter((name) => !excludedPages.includes(name.link.replace("/", "")));

  const pagesWithoutLocales = _pagesWithoutLocales
    .map((file) => {
      const fileName = file.replace(input, "").replace(".html", "");
      const fileNameWithSlash = fileName.includes("index")
        ? fileName
        : fileName + "/";
      return {
        link: fileNameWithSlash.replace("index", ""),
        priority: Math.max(
          0.1,
          1 - (fileNameWithSlash.match(/\//g) || []).length * 0.1
        ),
      };
    })
    .filter((name) => !excludedPages.includes(name.link.replace("/", "")));

  return `
<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pagesWithLocales
    .map(
      (page) => `
    <url>
      <loc>${domain}/${page.link}</loc>${locales
        .map(
          (locale) => `
      <xhtml:link rel="alternate" hreflang="${locale}" href="${domain}/${page.link.replace(
            locale,
            ""
          )}"/>`
        )
        .join("")}
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join("")}${pagesWithoutLocales
    .map(
      (page) => `
    <url>
      <loc>${domain}/${page.link}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join("")}
  </urlset>
`;
};

const classicSitemapGenerator = ({
  input,
  allHtmlFiles,
  excludedPages,
  domain,
}: {
  input: string;
  allHtmlFiles: string[];
  excludedPages: string[];
  domain: string;
}) => {
  const pages = allHtmlFiles
    .map((file) => {
      const fileName = file.replace(input, "").replace(".html", "");
      const fileNameWithSlash = fileName.includes("index")
        ? fileName
        : fileName + "/";
      return {
        link: fileNameWithSlash.replace("index", ""),
        priority: Math.max(
          0.1,
          1 - (fileNameWithSlash.match(/\//g) || []).length * 0.1
        ),
      };
    })
    .filter((name) => !excludedPages.includes(name.link.replace("/", "")));

  return `
<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .map(
      (page) => `
    <url>
      <loc>${domain}/${page.link}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join("")}
  </urlset>
`;
};
