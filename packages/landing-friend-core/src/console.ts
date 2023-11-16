import chalk from "chalk";

type Colors = keyof Pick<
  typeof chalk,
  | "bgBlue"
  | "bgBlueBright"
  | "bgGreen"
  | "bgMagenta"
  | "bgRed"
  | "bgRedBright"
  | "bgYellow"
  | "blue"
  | "blueBright"
  | "green"
  | "greenBright"
  | "magenta"
  | "red"
  | "redBright"
  | "yellow"
  | "yellowBright"
>;

export const message = (m: string, color: Colors) => {
  console.log(chalk[color](m));
};

export const messageWithContent = (m: string, content: string, color: Colors) => {
  console.log(`${chalk[color](m)}${content}`);
};
