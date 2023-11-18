import { AdvancedTagsNameType, CombineTagsWithReason } from "@/index.js";

interface Props {
  value: CombineTagsWithReason;
  tag: AdvancedTagsNameType;
}

export const generateMetaTagsSection = ({ value, tag }: Props) => {
  return value.listOfFoundMeta
    ? `
  <tr
  ><td colspan="2"><strong>List of advanced meta tag <span style="color:green">${tag}</span> (Number of tags: ${
        value.tagAmount
      })</strong> </td>
  </tr>
  ${Object.entries(value.listOfFoundMeta)
    .map(([title, metaValue]) => {
      return `
          <tr>${
            metaValue
              ? `<td colspan="2" style="color:${
                  !metaValue.status || metaValue.status === "OK" ? "black" : "red"
                }">Content of <strong>${title}</strong>: ${
                  metaValue.content
                    ? metaValue.content.includes("https")
                      ? `<a href="${metaValue.content}" style="cursor:pointer">${metaValue.content}</a>`
                      : metaValue.content
                    : "No content detected"
                } 
              ${metaValue.status ? ` | <strong>Url status: ${metaValue.status}</strong>` : ""}
              ${
                metaValue.forbiddenCharacters
                  ? `<span style="color:red">${metaValue.forbiddenCharacters}</span>`
                  : ""
              } 
                </td>`
              : ""
          }
          </tr>`;
    })
    .join("")}
    `
    : "";
};
