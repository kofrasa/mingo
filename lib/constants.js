
// Javascript native types
export const T_NULL = 'null'
export const T_UNDEFINED = 'undefined'
export const T_BOOL = 'bool'
export const T_BOOLEAN = 'boolean'
export const T_NUMBER = 'number'
export const T_STRING = 'string'
export const T_DATE = 'date'
export const T_REGEX = 'regex'
export const T_REGEXP = 'regexp'
export const T_ARRAY = 'array'
export const T_OBJECT = 'object'
export const T_FUNCTION = 'function'

// no array, object, or function types
export const JS_SIMPLE_TYPES = [T_NULL, T_UNDEFINED, T_BOOLEAN, T_NUMBER, T_STRING, T_DATE, T_REGEXP]

// operator classes
export const OP_AGGREGATE = 'aggregate'
export const OP_GROUP = 'group'
export const OP_PIPELINE = 'pipeline'
export const OP_PROJECTION = 'projection'
export const OP_QUERY = 'query'