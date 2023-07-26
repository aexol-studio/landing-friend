import chalk from "chalk";
import cliSpinners from "cli-spinners";
import ora, { Color } from "ora";

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

export const messageWithContent = (
  m: string,
  content: string,
  color: Colors
) => {
  console.log(`${chalk[color](m)}${content}`);
};

export const calcTime = (m: string, color: Colors) => {
  console.time(chalk[color](m));
  return {
    end: () => console.timeEnd(chalk[color](m)),
  };
};

export const loader = (input: {
  text: string;
  onSuccess?: string;
  onFail?: string;
  colorSpinner?: Color;
  fastSpinner?: boolean;
}) => {
  const { text, colorSpinner, fastSpinner, onFail, onSuccess } = input;
  const spinner = ora({
    text,
    color: colorSpinner,
    spinner: fastSpinner ? cliSpinners.bluePulse : cliSpinners.aesthetic,
  }).start();
  return {
    succeed: () => spinner.succeed(onSuccess),
    fail: () => spinner.fail(onFail),
    clear: () => spinner.clear(),
  };
};
