interface Period {
  start?: string;
  end?: string;
}

interface Coding {
  system?: string;
  code?: string;
  display?: string;
  version?: string;
  userSelected?: boolean;
}

interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

interface Identifier {
  use?: string;
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
}

interface Meta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: Coding[];
  tag?: Coding[];
}

interface ContactPoint {
  system?: string;
  value?: string;
  use?: string;
  rank?: number;
  period?: Period;
}

interface ContactDetail {
  name?: string;
  telecom?: ContactPoint[];
}

interface Quantity {
  value?: number;
  comparator?: string;
  unit?: string;
  system?: string;
  code?: string;
}

interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

interface Range {
  low?: Quantity;
  high?: Quantity;
}

interface UsageContext {
  code?: Coding;
  valueCodeableConcept?: CodeableConcept;
  valueQuantity?: Quantity;
  valueRange?: Range;
  valueReference?: Reference;
}

interface Constant {
  name: string;
  valueBase64Binary?: string;
  valueBoolean?: boolean;
  valueCanonical?: string;
  valueCode?: string;
  valueDate?: string;
  valueDateTime?: string;
  valueDecimal?: number;
  valueId?: string;
  valueInstant?: string;
  valueInteger?: number;
  valueInteger64?: number;
  valueOid?: string;
  valueString?: string;
  valuePositiveInt?: number;
  valueTime?: string;
  valueUnsignedInt?: number;
  valueUri?: string;
  valueUrl?: string;
  valueUuid?: string;
}

export interface Column {
  path: string | Compile;
  name: string;
  description?: string;
  collection?: boolean;
  type?: string;
  tag?: {
    name: string;
    value: string;
  }[];
}

export interface Select {
  select?: Select[];
  column: Column[];
  forEach?: string;
  forEachOrNull?: string;
  unionAll?: Select[];
}

interface Where {
  path: string;
  description?: string;
}

export interface ViewDefinition {
  uri?: string;
  identifier?: string;
  name?: string;
  title?: string;
  meta?: Meta;
  status: "draft" | "active" | "retired" | "unknown";
  experimental?: boolean;
  publisher?: string;
  contact?: ContactDetail[];
  description?: string;
  useContext?: UsageContext[];
  copyright?: string;
  resource?: string;
  fhirVersion?: string;
  constant?: Constant[];
  select: Select[];
  where?: Where[];
}

export interface Row {}
