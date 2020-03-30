
export const MAX_INT = 2147483647
export const MIN_INT = -2147483648
export const MAX_LONG = Number.MAX_SAFE_INTEGER
export const MIN_LONG = Number.MIN_SAFE_INTEGER

export const MISSING = () => { }

// Javascript native types
export enum JsType {
  NULL = 'null',
  UNDEFINED = 'undefined',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  DATE = 'date',
  REGEXP = 'regexp',
  ARRAY = 'array',
  OBJECT = 'object',
  FUNCTION = 'function'
}

export enum BsonType {
  BOOL = 'bool',
  INT = 'int',
  LONG = 'long',
  DOUBLE = 'double',
  DECIMAL = 'decimal',
  REGEX = 'regex'
}