import { evaluate } from "../src";

export function isEqual(a: any[], b: any[]): any {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((val, index) => isEqual(val, b[index]))
    );
  } else {
    return a === b;
  }
}

export function canonicalize(arr: any[]) {
  if (arr === undefined) {
    arr = [];
  }
  if (!Array.isArray(arr)) {
    throw new Error("Expected array, got " + JSON.stringify(arr));
  }
  return [...arr].sort((a, b) => {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    for (let i = 0; i < Math.min(keysA.length, keysB.length); i++) {
      if (a[keysA[i]] < b[keysB[i]]) return -1;
      if (a[keysA[i]] > b[keysB[i]]) return 1;
    }

    return keysA.length - keysB.length; // if one has more keys than the other
  });
}

export function arraysMatch(arr1: any[], arr2: any[]) {
  // Canonicalize arrays

  arr1 = canonicalize(arr1);
  arr2 = canonicalize(arr2);

  // Check if arrays are of the same length
  if (arr1.length !== arr2.length) {
    return {
      passed: false,
      message: `Array lengths do not match. Expected ${arr2.length} but got ${arr1.length}.`,
    };
  }

  // Check each pair of objects
  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i];
    const obj2 = arr2[i];

    // Get keys of both objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check if both objects have the same number of keys
    if (keys1.length !== keys2.length) {
      return {
        passed: false,
        message: `Objects at index ${i} have different number of keys.`,
      };
    }

    // Check if keys and values match for both objects
    for (const key of keys1) {
      if (!isEqual(obj1[key], obj2[key])) {
        return {
          passed: false,
          message: `Mismatch at index ${i} for key "${key}". Expected "${obj2[key]}" but got "${obj1[key]}".`,
        };
      }
    }
  }

  return {
    passed: true,
  };
}

export function runTest(test: any, resources: any[]) {
  if (test.expectError) {
    return runThrowingTest(test);
  }

  try {
    const result = evaluate(test.view, resources);

    if (test.expectCount) {
      const passed = result.length === test.expectCount;
      return passed
        ? { passed }
        : {
            passed,
            expectedCount: test.expectCount,
            actual: result.length,
          };
    } else {
      const match = arraysMatch(result, test.expect);
      return {
        passed: match.passed,
        expected: test.expect,
        actual: result,
        message: match.message,
      };
    }
  } catch (e: any) {
    return {
      passed: null,
      message: e.toString(),
    };
  }
}

export function runThrowingTest(test: any, resources?: any[]) {
  try {
    const result = evaluate(test.view, resources);
    return {
      passed: false,
      expectedFail: true,
      actual: result,
    };
  } catch (e) {
    return { passed: true };
  }
}
