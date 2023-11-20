import { DuplicatedSearchName, FileWithDuplicateContent, generateContentToRow } from "@/index.js";

interface Row {
  fileWithContent: FileWithDuplicateContent;
  tableIndex: number;
}

export const generateRow = ({ fileWithContent, tableIndex }: Row): string => {
  let rows = "";
  if (!fileWithContent) return "";

  const row = Object.entries(fileWithContent).map(([fileName, contentWithOption]) => {
    let allErrors = 0;
    let contentToRow = "";
    for (const name of Object.values(DuplicatedSearchName)) {
      const data = generateContentToRow({ contentWithOption, name });
      if (data) {
        allErrors += data.numberOfErrors;
        contentToRow += data.content;
      }
    }

    return `
    <table>
    <thead>
        <tr>
            <th colspan="2">
                ${fileName} | Number of errors: (${allErrors})
                <span class="toggle-button" id="toggle-button-${tableIndex}">▼</span>
            </th>
        </tr>
    </thead>
    <tbody id="toggle-body-${tableIndex}" class="hidden">
        ${contentToRow}
    </tbody>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const toggleButton = document.getElementById("toggle-button-${tableIndex}");
            const toggleBody = document.getElementById("toggle-body-${tableIndex}");
            toggleButton &&
                toggleBody &&
                toggleButton.addEventListener("click", () => {
                    if (toggleBody.classList.contains("hidden")) {
                        toggleBody.classList.remove("hidden");
                        toggleButton.textContent = "▲";
                    } else {
                        toggleBody.classList.add("hidden");
                        toggleButton.textContent = "▼";
                    }
                });
        })
    </script>
</table>
    `;
  });
  rows = rows + row.join("");
  return rows;
};
