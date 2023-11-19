import { staticTags, unicode } from "@/index.js";

export const clearContent = (content: string) => {
  let finalContent = content;

  for (const staticTag of staticTags) {
    const staticTagRegex = new RegExp(
      `<${staticTag}.*?>|</${staticTag}>|\\.css.*?}|@media.*?}|{|}`,
      "g"
    );
    finalContent = finalContent.replace(staticTagRegex, "");
  }

  for (const [entity, replacement] of Object.entries(unicode)) {
    const entityRegex = new RegExp(entity, "g");
    finalContent = finalContent.replace(entityRegex, replacement);
  }

  return finalContent;
};
