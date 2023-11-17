export const matchedSetting = (file: string, paths: string[]) => {
  file = file.endsWith("/") ? file : file + "/";
  if (paths.length > 0) {
    if (
      paths.find(path => {
        const regexPattern = path
          .replace(/\/$/g, "/$")
          .replace(/^\.\//g, "^/")
          .replace("*/", "/")
          .replace("/*", "/");
        return file.match(new RegExp(regexPattern, "g")) !== null;
      })
    ) {
      return true;
    }
  }
  return false;
};
