import {
  ViewDefinition,
  Select,
  Row,
  Resource,
  Bundle,
  Constant,
} from "./types";
import { validateViewDefinition } from "./validate";
import fhirpath from "fhirpath";

export function evaluate(
  viewDefinition: ViewDefinition,
  fhirData: Resource | Resource[] | Bundle
) {
  if (fhirData.resourceType === "Bundle") {
    return processResources(
      viewDefinition,
      fhirData.entry.map((e: any) => e.resource)
    );
  } else if (!Array.isArray(fhirData)) {
    return processResources(viewDefinition, [fhirData]);
  } else {
    return processResources(viewDefinition, fhirData);
  }
}

function compilePath(path: string | Compile, constants?: Map<string, string>) {
  const constantRegex = /%([a-zA-Z0-9_]+)/g;

  if (typeof path === "string") {
    if (constants) {
      path = path.replace(constantRegex, (match, p1) => {
        const value = constants.get(p1);
        if (value) {
          return value;
        } else {
          throw new Error(`Constant value not found for ${p1}`);
        }
      });
    }

    return fhirpath.compile(path);
  } else {
    throw new Error("Path must be a string");
  }
}

function compileSelectPaths(select: Select, constants?: Map<string, string>) {
  if (select.column) {
    select.column.forEach((col) => {
      col.path = compilePath(col.path, constants);
    });
  }
  if (select.forEach) {
    select.forEach = compilePath(select.forEach, constants);
  }
  if (select.forEachOrNull) {
    select.forEachOrNull = compilePath(select.forEachOrNull, constants);
  }

  select.select?.forEach((s) => compileSelectPaths(s, constants));
  select.unionAll?.forEach((s) => compileSelectPaths(s, constants));
}

// Main entry point to process resources based on a view definition
export function processResources(V: ViewDefinition, R: any[]) {
  validateViewDefinition(V);
  const constantMap = new Map<string, any>();
  V.constant?.forEach((c) => {
    let value =
      c.valueBoolean ??
      c.valueString ??
      c.valueInteger ??
      c.valueDecimal ??
      c.valueDateTime ??
      c.valueDate ??
      c.valueUri ??
      c.valueUrl ??
      c.valueUuid ??
      c.valueBase64Binary ??
      c.valueCanonical ??
      c.valueCode ??
      c.valueId ??
      c.valueInstant ??
      c.valueOid ??
      c.valuePositiveInt ??
      c.valueTime ??
      c.valueUnsignedInt ??
      c.valueInteger64 ??
      null;

    if (c.valueString) {
      value = "'" + value + "'";
    }

    if (value !== null) {
      constantMap.set(c.name, value);
    } else {
      throw new Error(`Constant value not found for ${c.name}`);
    }
  });

  V.select.forEach((s) => compileSelectPaths(s, constantMap));
  V.where?.forEach((w) => (w.path = compilePath(w.path, constantMap)));

  let filteredResources = R;

  filteredResources = R.filter((r) => {
    if (r.resourceType !== V.resource) {
      return false;
    }
    if (V.where) {
      for (const condition of V.where!) {
        const result = (condition.path as Compile)(r);
        if (!result || result.length === 0 || !result[0]) {
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

function processSelect(selectInput: Select[], fhirData: Object) {
  // Process a selection structure recursively
  const rows: Row[][] = [];

  function _processSelect(S: Select[], f: any) {
    for (const selection of S) {
      let foci;
      if (selection.forEach) {
        foci = (selection.forEach as Compile)(f);
      } else if (selection.forEachOrNull) {
        foci = (selection.forEachOrNull as Compile)(f);
        if (!foci) {
          foci = [null];
        }
      } else {
        foci = [f];
      }

      const selectionRows: Row[] = [];

      for (const f of foci) {
        const baseRow: Row = {};
        if (selection.column) {
          for (const col of selection.column) {
            const val = (col.path as Compile)(f);
            if (val.length === 0) {
              baseRow[col.name] = null;
            } else if (val.length === 1 && !col.collection) {
              baseRow[col.name] = val[0];
            } else if (col.collection) {
              baseRow[col.name] = val;
            } else {
              throw new Error(
                "Multiple values found but not expected for column"
              );
            }
          }
        }
        selectionRows.push(baseRow);

        // Process Nested Selections
        if (selection.select) {
          _processSelect(selection.select, f);
        }

        // Process Union Alls
        if (selection.unionAll) {
          _processSelect(selection.unionAll, f);
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
