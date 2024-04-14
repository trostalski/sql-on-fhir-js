import * as fs from "fs";
import path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { Select, ViewDefinition } from "./types";

export function validateViewDefinition(viewDefinition: ViewDefinition) {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  const schemaPath = path.join(__dirname, "schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);
  const valid = validate(viewDefinition);
  if (!valid) {
    throw new Error(
      validate.errors?.map((e) => JSON.stringify(e.message)).join(", ")
    );
  }
  validateSelect(viewDefinition.select);
}

function validateSelect(inputSelect: Select[]) {
  const seenColumns = new Set<string>();

  function _validateSelect(S: Select) {
    S.column?.forEach((column) => {
      if (seenColumns.has(column.name)) {
        throw new Error(`Duplicate column name: ${column.name}`);
      }
      seenColumns.add(column.name);
    });

    // Validate nested selections
    if (S.select) {
      S.select.forEach((select) => _validateSelect(select));
    }

    // Validate unionAll
    if (S.unionAll && S.unionAll.length > 0) {
      // Immediate throw if unionAll contains nested selects
      const invalidUnion = S.unionAll.find(
        (s) => s.select && s.select.length > 0
      );
      if (invalidUnion) {
        throw new Error("Union All cannot have nested select");
      }
      const firstUnionColumns = S.unionAll[0].column?.map((c) => c.name);
      if (
        firstUnionColumns &&
        S.unionAll.some((select) => {
          const columnNames = select.column?.map((c) => c.name);
          if (!columnNames) return false;
          return !arraysEqual(firstUnionColumns, columnNames); // Using arraysEqual for simplicity
        })
      ) {
        throw new Error("Union All column names must be the same");
      }
    }
  }
  inputSelect.forEach(_validateSelect);
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}
