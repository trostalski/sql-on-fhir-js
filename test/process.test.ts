import fs from "fs";
import path from "path";
import { processBundle, processResources } from "../src/process";

describe("should work on patient", () => {
  it("", async () => {
    const resFile = fs.readFileSync(
      path.join(__dirname, "..", "data", "bundle-01.json"),
      "utf-8"
    );
    const res = JSON.parse(resFile);
    const vdFile = fs.readFileSync(
      path.join(__dirname, "..", "data", "view-def-06.json"),
      "utf-8"
    );
    const vd = JSON.parse(vdFile);

    const rows = await processBundle(vd, res);
    console.log(JSON.stringify(rows, null, 2));
    // expect(rows).toEqual([
    //   {
    //     id: "1",
    //     name: "John Doe",
    //   }
    // ])
  });
});
