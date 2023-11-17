import { staticTags, unicode } from "@/index.js";

export const clearContent = (content: string | undefined) => {
  if (!content) return;
  let finalContent = content;
  staticTags.forEach(staticTag => {
    const staticTagRegex = new RegExp(`<${staticTag}.*?>|</${staticTag}>`, "g");
    Object.entries(unicode).forEach(([unicode, replacement]) => {
      const unicodeRegex = new RegExp(`${unicode}`, "g");
      finalContent = content.replace(unicodeRegex, replacement);
    });

    finalContent = content.replace(staticTagRegex, "");
  });

  return finalContent;
};
