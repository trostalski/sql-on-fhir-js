import { Column, Select, ViewDefinition } from "./types";

export function validateViewDefinition(V: ViewDefinition): void {
  if (!V.select || V.select.length === 0) {
    throw new Error("No Selections Defined");
  }
  if (!V.resource) {
    throw new Error("No Resourcetype Type Defined");
  }
  if (V.where && V.where.length > 0) {
    V.where.forEach((W) => {
      if (!W.path) {
        throw new Error("Where Clause Missing Path");
      }
    });
  }

  V.select.forEach((S) => validateColumns(S));
}

export function validateColumns(S: Select): void {
  const seenColumns = new Set<string>(); // Use a Set for seen column names for efficiency

  function _validateColumns(S: Select) {
    S.column.forEach((column) => {
      if (seenColumns.has(column.name)) {
        throw new Error(`Column Already Defined: ${column.name}`); // Improved error message
      }
      seenColumns.add(column.name);
    });

    // Validate nested selections
    if (S.select) {
      S.select.forEach((select) => _validateColumns(select));
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

      const firstUnionColumns = S.unionAll[0].column.map((c) => c.name);
      if (
        S.unionAll.some((select) => {
          const columnNames = select.column.map((c) => c.name);
          return !arraysEqual(firstUnionColumns, columnNames); // Using arraysEqual for simplicity
        })
      ) {
        throw new Error("Union All column names must be the same");
      }
    }
  }

  _validateColumns(S); // Start validation with the initial Select
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}
