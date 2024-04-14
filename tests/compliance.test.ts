// @ts-nocheck
import fs from "fs";
import path from "path";

import { evaluate } from "../src/index.ts";
import { runThrowingTest, runTest } from "./utils.ts";

const testDirectory = path.join(__dirname, "..", "sql-on-fhir-v2/tests/");
const files = fs.readdirSync(testDirectory);
const testResult = {};

afterAll(() => {
  fs.writeFileSync(
    "../test_report/test-results.json",
    JSON.stringify(testResult)
  );
});

files.forEach((f) => {
  const testGroup = JSON.parse(fs.readFileSync(testDirectory + f) as any);
  const resources = testGroup.resources;

  describe(f, () => {
    testResult[f] = { tests: [] };

    testGroup.tests.forEach((testCase) => {
      const view = testCase.view;

      if (testCase.expect !== undefined) {
        test(testCase.title, () => {
          const res = evaluate(view, resources);
          expect(res).toEqual(testCase.expect);

          testResult[f].tests.push({ result: runTest(testCase, resources) });
        });
      } else if (testCase.expectError !== undefined) {
        test(testCase.title, () => {
          expect(() => evaluate(view, resources)).toThrow();
        });

        testResult[f].tests.push({
          result: runThrowingTest(testCase, resources),
        });
      } else if (testCase.expectCount !== undefined) {
        throw new Error("expectCount is not implemented yet");
      } else {
        throw new Error(`'${testCase.title}' test has no known expectation`);
      }
    });
  });
});
