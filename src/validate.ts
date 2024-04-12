import * as fs from "fs";
import path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { Select, ViewDefinition } from "./types";

export function validateViewDefinition(viewDefinition: ViewDefinition) {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv); // Adds formats like "uri"

  const schemaPath = path.join(__dirname, "schema.json"); // Adjust the path as necessary
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);
  const valid = validate(viewDefinition);
  if (!valid) {
    console.log(validate.errors);
    throw new Error("Invalid View Definition");
  }
  viewDefinition.select.forEach((select) => validateSelect(select));
}

function validateSelect(inputSelect: Select) {
  const seenColumns = new Set<string>();

  function _validateSelect(S: Select) {
    inputSelect.column.forEach((column) => {
      if (seenColumns.has(column.name)) {
        throw new Error(`Duplicate column name: ${column.name}`);
      }
      seenColumns.add(column.name);
    });

    // Validate nested selections
    if (inputSelect.select) {
      inputSelect.select.forEach((select) => validateSelect(select));
    }

    // Validate unionAll
    if (inputSelect.unionAll && inputSelect.unionAll.length > 0) {
      // Immediate throw if unionAll contains nested selects
      const invalidUnion = inputSelect.unionAll.find(
        (s) => s.select && s.select.length > 0
      );
      if (invalidUnion) {
        throw new Error("Union All cannot have nested select");
      }
      const firstUnionColumns = inputSelect.unionAll[0].column.map(
        (c) => c.name
      );
      if (
        inputSelect.unionAll.some((select) => {
          const columnNames = select.column.map((c) => c.name);
          return !arraysEqual(firstUnionColumns, columnNames); // Using arraysEqual for simplicity
        })
      ) {
        throw new Error("Union All column names must be the same");
      }
    }
  }

  _validateSelect(inputSelect);
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}
