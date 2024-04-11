import fs from "fs";
import path from "path";
import { processResource } from "../src/process";

describe("should work on patient", () => {
  it("", async () => {
    const resFile = fs.readFileSync(
      path.join(__dirname, "..", "data", "patient-01.json"),
      "utf-8"
    );
    const res = JSON.parse(resFile);
    const vdFile = fs.readFileSync(
      path.join(__dirname, "..", "data", "view-def-01.json"),
      "utf-8"
    );
    const vd = JSON.parse(vdFile);

    const rows = await processResource(vd, res);
    console.log(rows);
  });
});
