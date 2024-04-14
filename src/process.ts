import { ViewDefinition, Select, Row } from "./types";
import { validateViewDefinition } from "./validate";
import fhirpath from "fhirpath";

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

  const rows = [];

  for (const r of filteredResources) {
    rows.push(...processSelect(V.select, r));
  }

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

// Process a selection structure recursively
function processSelect(selectInput: Select[], fhirData: Object) {
  const rows: Row[][] = [];

  function _processSelect(S: Select[], f: any) {
    for (const selection of S) {
      const foci = selection.forEach
        ? fhirpath.evaluate(fhirData, selection.forEach)
        : selection.forEachOrNull
        ? fhirpath.evaluate(fhirData, selection.forEachOrNull) || [null]
        : [fhirData];

      const selectionRows: Row[] = [];

      for (const f of foci) {
        const baseRow: Row = {};
        for (const col of selection.column) {
          const val = (col.path as Compile)(f);
          if (val.length === 0) {
            baseRow[col.name] = null;
          } else if (val.length === 1) {
            baseRow[col.name] = val[0];
          } else if (col.collection) {
            baseRow[col.name] = val;
          } else {
            throw new Error(
              "Multiple values found but not expected for column"
            );
          }
        }
        selectionRows.push(baseRow);

        // Process Nested Selections
        if (selection.select) {
          rows.push(..._processSelect(selection.select, f));
        }

        // Process Union Alls
        if (selection.unionAll) {
          rows.push(..._processSelect(selection.unionAll, f));
        }
      }
      rows.push(selectionRows);
    }
    return rows;
  }
  const finalRows = _processSelect(selectInput, fhirData);
  return crossJoinLists(finalRows);
}

function crossJoinLists(listsOfObjects: Row[][]): Row[] {
  if (listsOfObjects.length === 0) return [];
  if (listsOfObjects.length === 1) return listsOfObjects[0];

  // Helper function to perform the actual cross join recursively
  function recursiveCrossJoin(
    currentIndex: number,
    currentResult: Row[]
  ): Row[] {
    if (currentIndex === listsOfObjects.length) {
      return currentResult;
    }

    let nextResult: Row[] = [];
    const currentList = listsOfObjects[currentIndex];

    if (currentIndex === 0) {
      // Initialize with the first list of objects
      return recursiveCrossJoin(currentIndex + 1, currentList);
    } else {
      // Cross join the accumulated results with the current list
      for (const accObj of currentResult) {
        for (const newObj of currentList) {
          nextResult.push({ ...accObj, ...newObj });
        }
      }
      return recursiveCrossJoin(currentIndex + 1, nextResult);
    }
  }

  return recursiveCrossJoin(0, []);
}
