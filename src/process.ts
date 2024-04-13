import { ViewDefinition, Select, Row } from "./types";
import fhirpath from "fhirpath";
import { validateViewDefinition } from "./validate";

function compilePath(path: string | Compile) {
  if (typeof path === "string") {
    return fhirpath.compile(path);
  } else {
    return path;
  }
}

function compileSelectPaths(select: Select) {
  // Helper function to precompile all paths
  select.column.forEach((col) => {
    col.path = compilePath(col.path);
  });

  select.select?.forEach(compileSelectPaths);
  select.unionAll?.forEach(compileSelectPaths);
}

// Main entry point to process resources based on a view definition
export function processResources(
  V: ViewDefinition,
  R: any[]
): any[] | undefined {
  validateViewDefinition(V);
  V.select.forEach(compileSelectPaths);
  V.where?.forEach((w) => compilePath(w.path));

  let filteredResources = R;

  filteredResources = R.filter((r) => {
    if (V.resource && r.resourceType !== V.resource) {
      return false;
    }
    if (V.where) {
      for (const condition of V.where!) {
        const result = fhirpath.evaluate(r, condition.path);
        if (!result || result.length === 0) {
          return false;
        }
      }
    }
    return true;
  });

  const rows = filteredResources.map((r) => {
    return processSelect(V.select, r);
  });

  return rows;
}

export function processResource(V: ViewDefinition, R: any): undefined | any[] {
  const rows = processResources(V, [R]);
  return rows;
}

export function processBundle(V: ViewDefinition, B: any): undefined | any[] {
  if (B.resourceType !== "Bundle") {
    throw new Error("Resource is not a Bundle");
  } else if (!B.entry || B.entry.length === 0) {
    return;
  }

  const rows = processResources(
    V,
    B.entry.map((e: any) => e.resource)
  );

  return rows;
}

function processSelect(selectInput: Select[], fhirData: Object) {
  function _processSelect(
    selectInput: Select[],
    fhirData: Object,
    existingRows: Row[]
  ) {
    const rawSelects = selectInput.filter(
      (s) => !s.forEach && !s.forEachOrNull && !s.unionAll
    );
    const rawRows = [];
    for (const rawSelect of rawSelects) {
      const row: Row = {};
      for (const col of rawSelect.column) {
        const val = (col.path as Compile)(fhirData);
        if (val.length === 0) {
          row[col.name] = null;
        } else if (val.length === 1) {
          row[col.name] = val[0];
        } else if (col.collection) {
          row[col.name] = val;
        } else {
          throw new Error("Multiple values found but not expected for column");
        }
      }
      rawRows.push(row);
    }
  }
}

// Process a selection structure recursively
// function processSelect(selectInput: Select[], fhirData: Object) {
//   const rows: Row[][] = [];

//   function _processSelect(S: Select[], f: any, rows: Row[][]) {
//     for (const selection of selectInput) {
//       const foci = selection.forEach
//         ? fhirpath.evaluate(fhirData, selection.forEach)
//         : selection.forEachOrNull
//         ? fhirpath.evaluate(fhirData, selection.forEachOrNull) || [null]
//         : [fhirData];

//       for (const f of foci) {
//         const baseRows =
//         for (const col of selection.column) {
//           const row: { [key: string]: any } = {};
//           const val = (col.path as Compile)(f);
//           if (val.length === 0) {
//             row[col.name] = null;
//           } else if (val.length === 1) {
//             row[col.name] = val[0];
//           } else if (col.collection) {
//             row[col.name] = val;
//           } else {
//             throw new Error(
//               "Multiple values found but not expected for column"
//             );
//           }
//           baseRows.push(row);
//         }
//         rows.push(baseRows);

//         // Process Nested Selections
//         if (selection.select) {
//           rows.push(_processSelect(selection.select, f));
//         }

//         // Process Union Alls
//         if (selection.unionAll) {
//           rows.push(_processSelect(selection.unionAll, f));
//         }
//       }
//     }
//     return rows;
//   }
//   const finalRows = _processSelect(selectInput, fhirData);
//   return cartesianProduct(finalRows);
// }

// Helper function to compute Cartesian product of arrays
function cartesianProduct(arrays: any[][]) {
  const keys = new Set();
  const rows: any = [];
}
