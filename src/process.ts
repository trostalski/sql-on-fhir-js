import { ViewDefinition, Select, Column } from "./types";
import fhirpath from "fhirpath";

// Main entry point to process a resource based on a view definition
export async function processResource(
  V: ViewDefinition,
  R: any
): Promise<undefined | any[]> {
  if (R.resourceType !== V.resource) {
    return;
  } else if (V.where && V.where.length > 0) {
    for (const condition of V.where) {
      const result = fhirpath.evaluate(R, condition.path);
      if (!result || result.length === 0) {
        return;
      }
    }
  }

  const rows = await processSelectionStructure(V.select, R);
  return rows;
}
export async function processResources(
  V: ViewDefinition,
  R: any[]
): Promise<any[]> {
  const rows = [];
  for (const r of R) {
    const row = await processResource(V, r);
    if (row) {
      rows.push(...row);
    }
  }
  return rows;
}

export async function processBundle(
  V: ViewDefinition,
  B: any
): Promise<undefined | any[]> {
  if (B.resourceType !== "Bundle") {
    throw new Error("Resource is not a Bundle");
  } else if (!B.entry || B.entry.length === 0) {
    return;
  }

  const rows = await processResources(
    V,
    B.entry.map((e: any) => e.resource)
  );

  return rows;
}

// Process a selection structure recursively
async function processSelectionStructure(
  selections: Select[],
  N: any
): Promise<any[]> {
  let finalRows = [];

  for (const selection of selections) {
    const foci = selection.forEach
      ? fhirpath.evaluate(N, selection.forEach)
      : selection.forEachOrNull
      ? fhirpath.evaluate(N, selection.forEachOrNull) || [null]
      : [N];

    for (const f of foci) {
      const parts = [];

      // Process Columns
      for (const col of selection.column) {
        const val = fhirpath.evaluate(f, col.path);
        let b: {
          [key: string]: any;
        } = {};
        if (val.length === 0) {
          b[col.name] = null;
        } else if (val.length === 1) {
          b[col.name] = val[0];
        } else if (col.collection) {
          b[col.name] = val;
        } else {
          throw new Error("Multiple values found but not expected for column");
        }
        parts.push([b]);
      }

      // Process Nested Selections
      for (const sel of selection.select!) {
        const rows = await processSelectionStructure([sel], f);
        parts.push(rows);
      }

      // Process Union Alls
      if (selection.unionAll) {
        const urows = [];
        for (const u of selection.unionAll) {
          const rows = await processSelectionStructure([u], f);
          urows.push(...rows);
        }
        parts.push(urows);
      }

      // Combine parts into complete rows using Cartesian product
      const combinedRows = cartesianProduct(parts);
      finalRows.push(...combinedRows);
    }
  }

  return finalRows;
}

// Helper function to compute Cartesian product of arrays
function cartesianProduct(arrays: any[][]) {
  return arrays.reduce(
    (a, b) => a.flatMap((d) => b.map((e) => ({ ...d, ...e }))),
    [{}]
  );
}
