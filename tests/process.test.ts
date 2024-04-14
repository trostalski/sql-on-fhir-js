// @ts-nocheck
import fs from "fs";
import path from "path";
import { evaluate } from "../src/process";
import { runThrowingTest } from "./utils";

// print current directory
const testDirectory = path.join(__dirname, "..", "test-cases/");

const files = fs.readdirSync(testDirectory);
const testResult = {};

files.forEach((f) => {
  const testGroup = JSON.parse(fs.readFileSync(testDirectory + f) as any);
  const resources = testGroup.resources;

  describe(f, () => {
    testResult[f] = { tests: [] };

    testGroup.tests.forEach((testCase) => {
      const view = testCase.view;

      if (testCase.expect !== undefined) {
        test(testCase.title, () => {
          console.log("TITLE: ", testCase.title);
          const res = evaluate(view, resources);
          console.log("RES: ", res);
          expect(res).toEqual(testCase.expect);
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
