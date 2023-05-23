// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { Options } from "../../../core";
import { AnyVal, Predicate, RawObject } from "../../../types";

/**
 * Validate documents against the given JSON Schema.
 *
 * @param selector
 * @param schema
 * @returns {Function}
 */
export function $jsonSchema(
  _: string,
  schema: AnyVal,
  options: Options
): Predicate<AnyVal> {
  if (!options?.jsonSchemaValidator) {
    throw new Error(
      "Missing option 'jsonSchemaValidator'. Configure to use '$jsonSchema' operator."
    );
  }
  const validate = options?.jsonSchemaValidator(schema as RawObject);
  return (obj: RawObject) => validate(obj);
}
