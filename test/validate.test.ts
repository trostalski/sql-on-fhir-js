import { validateViewDefinition, validateColumns } from "../src/validate";
import { ViewDefinition, Select, Column } from "../src/types";

describe("validateViewDefinition", () => {
  it("should throw an error if no selections are defined", () => {
    const viewDefinition: ViewDefinition = {
      where: [],
      status: "draft",
      resource: "Patient",
      select: [],
    };
    expect(() => validateViewDefinition(viewDefinition)).toThrow(
      "No Selections Defined"
    );
  });

  it("should throw an error if no resource type is defined", () => {
    const viewDefinition: ViewDefinition = {
      where: [],
      status: "draft",
      select: [
        {
          column: [],
          select: [],
        },
      ],
    };
    expect(() => validateViewDefinition(viewDefinition)).toThrow(
      "No Resourcetype Type Defined"
    );
  });

  it("should throw an error if where clause is missing a path", () => {
    const viewDefinition: ViewDefinition = {
      status: "draft",
      resource: "Patient",
      select: [{ column: [], select: [] }],
      where: [{ path: "" }],
    };
    expect(() => validateViewDefinition(viewDefinition)).toThrow(
      "Where Clause Missing Path"
    );
  });
});

describe("validateColumns", () => {
  it("should validate columns without throwing an error", () => {
    const columns: Column[] = [{ name: "id", path: "Patient.id" }];
    const select: Select = { column: columns, select: [] };
    expect(() => validateColumns(select)).not.toThrow();
  });

  it("should throw an error if columns have the same name", () => {
    const columns: Column[] = [
      { name: "id", path: "Patient.id" },
      { name: "id", path: "Patient.identifier" },
    ];
    const select: Select = { column: columns, select: [] };
    expect(() => validateColumns(select)).toThrow("Column Already Defined");
  });

  // Test for recursive column validation and unionAll
  it("should handle unionAll with inconsistent columns", () => {
    const baseColumns: Column[] = [{ name: "gender", path: "Patient.gender" }];
    const unionColumns1: Column[] = [{ name: "id", path: "Patient.id" }];
    const unionColumns2: Column[] = [{ name: "name", path: "Patient.name" }];

    const select: Select = {
      column: baseColumns,
      select: [],
      unionAll: [
        { column: unionColumns1, select: [] },
        { column: unionColumns2, select: [] },
      ],
    };
    expect(() => validateColumns(select)).toThrow(
      "Union All column names must be the same"
    );
  });
});

describe("validateViewDefinition - Additional Valid Cases", () => {
  it("should pass validation with a minimal valid view definition", () => {
    const viewDefinition: ViewDefinition = {
      where: [],
      status: "draft",
      resource: "Patient",
      select: [
        {
          column: [{ name: "id", path: "Patient.id" }],
          select: [],
        },
      ],
    };
    expect(() => validateViewDefinition(viewDefinition)).not.toThrow();
  });

  it("should pass validation even if where clause is optional and not provided", () => {
    const viewDefinition: ViewDefinition = {
      where: [],
      status: "draft",
      resource: "Patient",
      select: [
        {
          column: [{ name: "name", path: "Patient.name" }],
          select: [],
        },
      ],
    };
    expect(() => validateViewDefinition(viewDefinition)).not.toThrow();
  });
});

describe("validateColumns - Valid Scenarios", () => {
  it("should validate deeply nested selections without throwing an error", () => {
    const columns: Column[] = [{ name: "id", path: "Patient.id" }];
    const nestedSelect: Select = {
      column: [{ name: "name", path: "Patient.name" }],
      select: [],
    };
    const select: Select = {
      column: columns,
      select: [nestedSelect],
    };
    console.log(select);
    expect(() => validateColumns(select)).not.toThrow();
  });

  it("should handle valid unionAll structures", () => {
    const columns: Column[] = [{ name: "id", path: "Patient.id" }];
    const unionSelect1: Select = { column: columns, select: [] };
    const unionSelect2: Select = { column: columns, select: [] };

    const select: Select = {
      column: columns,
      select: [],
      unionAll: [unionSelect1, unionSelect2],
    };
    expect(() => validateColumns(select)).not.toThrow();
  });
});

describe("validateColumns - Error Scenarios", () => {
  it("should throw an error if nested selections define the same column name", () => {
    const columns: Column[] = [{ name: "id", path: "Patient.id" }];
    const nestedSelect: Select = {
      column: [{ name: "id", path: "Patient.birthDate" }],
      select: [],
    };
    const select: Select = {
      column: columns,
      select: [nestedSelect],
    };
    expect(() => validateColumns(select)).toThrow("Column Already Defined");
  });
});
