import fs from "fs";
import path from "path";

export const getHtmlFiles = (
  base: string,
  dir: string,
  fileList = [] as string[]
) => {
  const files = fs.readdirSync(dir);
  files.forEach((file: string) => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      getHtmlFiles(base, filePath, fileList);
    } else if (path.extname(filePath) === ".html") {
      let realFile = filePath
        .replace(/\\/g, "/")
        .replace(base.replace("./", ""), "")
        .replace(".html", "");
      if (realFile.includes("/index")) {
        realFile = realFile.replace("/index", "");
      }
      fileList.push(realFile);
    }
  });

  return fileList;
};

export const saveFile = (filePath: string, content: string) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
};
