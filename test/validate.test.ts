import { ViewDefinition } from "../src/types";
import { validateViewDefinition } from "../src/validate";

describe("validateViewDefinition", () => {
  it("should validate a correct ViewDefinition", () => {
    const viewDefinition: ViewDefinition = {
      uri: "http://example.com",
      identifier: "exampleIdentifier",
      name: "Example View",
      title: "Example View Title",
      meta: {
        versionId: "1",
        lastUpdated: "2020-01-01T00:00:00Z",
        source: "http://source.example.com",
        profile: [],
        security: [],
        tag: [],
      },
      status: "active",
      experimental: false,
      publisher: "Example Publisher",
      contact: [],
      description: "An example view definition",
      useContext: [],
      copyright: "Copyright 2021 Example Inc.",
      resource: "Example Resource",
      fhirVersion: "4.0.1",
      constant: [],
      select: [
        {
          column: [
            {
              path: "path.to.property",
              name: "Property",
              type: "string",
            },
          ],
        },
      ],
      where: [],
    };

    expect(() => validateViewDefinition(viewDefinition)).not.toThrow();
  });

  it("should throw an error if select is empty", () => {
    const viewDefinition: ViewDefinition = {
      name: "Invalid View",
      status: "active",
      select: [], // Empty select array should cause validation to fail
      where: [],
    };

    expect(() => validateViewDefinition(viewDefinition)).toThrow(
      "Invalid View Definition"
    );
  });

  it("should throw an error for duplicate column names", () => {
    const viewDefinition: ViewDefinition = {
      name: "Invalid View",
      status: "active",
      select: [
        {
          column: [
            { path: "path.to.property", name: "Property", type: "string" },
            { path: "path.to.property", name: "Property", type: "string" }, // Duplicate name
          ],
        },
      ],
      where: [],
    };

    expect(() => validateViewDefinition(viewDefinition)).toThrow(
      "Duplicate column name: Property"
    );
  });

  // Add more tests to cover unionAll and other complex scenarios
});
