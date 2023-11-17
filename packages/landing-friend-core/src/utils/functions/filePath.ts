import { fileLocation } from "@/index.js";

export enum FileName {
  analyze = "seo-analyze",
  duplicated = "duplicated-analyze",
}

export const fileName = (name: FileName, extension: ".json" | ".html") => `${name}${extension}`;
export const pathName = (name: FileName, extension: ".json" | ".html") =>
  `${fileLocation}/${fileName(name, extension)}`;
