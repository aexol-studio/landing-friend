import { FileWithDuplicateContent, generateRows } from "@/index.js";

interface Props {
  dataArray: FileWithDuplicateContent[];
  domain: string;
}

export const prepareDuplicatedHtml = ({ dataArray, domain }: Props): string => {
  const rows = generateRows(dataArray);

  return `
<!DOCTYPE html>
<html>

<head>
    <title>SEO analyze</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f9f9f9;
        }

        h1 {
            margin-bottom: 20px;
        }

        h4 {
            word-break: break-word;
            margin-bottom: 12px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin: 30px 0px 60px;
        }

        th,
        td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
            justify-content: space-between;
        }

        th {
            background-color: #f2f2f2;
        }

        tr:nth-child(even) {
            background-color: #f2f2f2;
        }

        .center {
            text-align: center;
        }

        .toggle-button {
            cursor: pointer;
        }

        .hidden {
            display: none;
        }
    </style>
</head>

<body>
    <h1>Duplicated pages for ${domain}</h1>
    <table>
        ${rows}
    
    </table>
</body>
</html>
`;
};
