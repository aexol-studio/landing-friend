import { DuplicatedContentWithName, DuplicatedSearchName } from "@/index.js";

const nameChanger = (name: DuplicatedSearchName) => {
  return name === DuplicatedSearchName.SameMetaDesc
    ? "Found duplicated meta description"
    : name === DuplicatedSearchName.SamePage
    ? "Found duplicated pages"
    : "Found duplicated page title";
};

interface GenerateContent {
  contentWithOption: DuplicatedContentWithName;
  name: DuplicatedSearchName;
}

export const generateContentToRow = ({ contentWithOption, name }: GenerateContent) => {
  const value = contentWithOption[name];
  if (!value) return;
  return {
    numberOfErrors: value.numberOfDuplicates,
    content: `
    <tr>
    <td>${nameChanger(name)}: <strong>${value.numberOfDuplicates}</strong></td>
    <td>${value.duplicatesOnSite.map(d => `<div style="padding: 2px 0;">${d}</div>`).join("")}</td>
    </tr>
    `,
  };
};
