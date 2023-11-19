export const matchedSetting = (file: string, paths: string[]) => {
  let newFile = file
    .replace("\\", "/")
    .replace(/\.html|\.php/g, "")
    .replace(/index/g, "")
    .replace(/\/$/g, "");

  newFile = newFile.endsWith("/") ? newFile : newFile + "/";
  if (paths.length > 0) {
    if (
      paths.find(path => {
        const regexPattern = path
          .replace(/\/$/g, "/$")
          .replace(/^\.\//g, "^/")
          .replace("*/", "/")
          .replace("/*", "/");
        return newFile.match(new RegExp(regexPattern, "g")) !== null;
      })
    ) {
      return true;
    }
  }
  return false;
};
