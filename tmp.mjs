import fhirpath from "fhirpath";

const regex = /%([a-zA-Z0-9_]+)/g;

let a = "a.%hell_bdsa_o.b";

a = a.replace(regex, "Hello");

const resources = [
  {
    resourceType: "Patient",
    id: "pt1",
    name: [
      {
        family: "Block",
        use: "usual",
      },
      {
        family: "Smith",
        use: "official",
      },
    ],
  },
  {
    resourceType: "Patient",
    id: "pt2",
    deceasedBoolean: true,
    name: [
      {
        family: "Johnson",
        use: "usual",
      },
      {
        family: "Menendez",
        use: "old",
      },
    ],
  },
];
const s = "name.where(use = 'official').family";

console.log(fhirpath.evaluate(resources, s));
//   const f = fhirpath.compile(s);
// const i = fhirpath.compile("id");
// console.log(f(resources));
