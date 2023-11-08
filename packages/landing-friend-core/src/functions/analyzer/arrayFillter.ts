export const arrayFilleter = (firstArray: string[], secondArray: string[]) => {
  return firstArray.filter(element => !secondArray.includes(element));
};
