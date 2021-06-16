import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, isNil, isString } from "../../../util";

const WHITESPACE_CHARS = [
  0x0000, // '\0' Null character
  0x0020, // ' ', Space
  0x0009, // '\t' Horizontal tab
  0x000a, // '\n' Line feed/new line
  0x000b, // '\v' Vertical tab
  0x000c, // '\f' Form feed
  0x000d, // '\r' Carriage return
  0x00a0, // Non-breaking space
  0x1680, // Ogham space mark
  0x2000, // En quad
  0x2001, // Em quad
  0x2002, // En space
  0x2003, // Em space
  0x2004, // Three-per-em space
  0x2005, // Four-per-em space
  0x2006, // Six-per-em space
  0x2007, // Figure space
  0x2008, // Punctuation space
  0x2009, // Thin space
  0x200a, // Hair space
];

/**
 * Trims the resolved string
 *
 * @param obj
 * @param expr
 * @param options
 */
export function trimString(
  obj: RawObject,
  expr: AnyVal,
  options: Options | undefined,
  trimOpts: { left: boolean; right: boolean }
): string {
  const val = computeValue(obj, expr, null, options) as RawObject;
  const s = val.input as string;
  if (isNil(s)) return null;

  const codepoints = isNil(val.chars)
    ? WHITESPACE_CHARS
    : (val.chars as string).split("").map((c: string) => c.codePointAt(0));

  let i = 0;
  let j = s.length - 1;

  while (
    trimOpts.left &&
    i <= j &&
    codepoints.indexOf(s[i].codePointAt(0)) !== -1
  )
    i++;
  while (
    trimOpts.right &&
    i <= j &&
    codepoints.indexOf(s[j].codePointAt(0)) !== -1
  )
    j--;

  return s.substring(i, j + 1);
}

/**
 * Performs a regex search
 *
 * @param obj
 * @param expr
 * @param opts
 */
export function regexSearch(
  obj: RawObject,
  expr: AnyVal,
  options: Options | undefined,
  reOpts: { global: boolean }
): RawArray | undefined {
  const val = computeValue(obj, expr, null, options) as RawObject;

  if (!isString(val.input)) return [];

  const regexOptions = val.options as string;

  if (regexOptions) {
    assert(
      regexOptions.indexOf("x") === -1,
      "extended capability option 'x' not supported"
    );
    assert(regexOptions.indexOf("g") === -1, "global option 'g' not supported");
  }

  let input = val.input;
  const re = new RegExp(val.regex as string, regexOptions);

  let m: RegExpMatchArray;
  const matches = [];
  let offset = 0;
  while ((m = re.exec(input))) {
    const result: { match: string; idx: number; captures: Array<string> } = {
      match: m[0],
      idx: m.index + offset,
      captures: [],
    };
    for (let i = 1; i < m.length; i++) {
      result.captures.push(m[i] || null);
    }

    matches.push(result);
    if (!reOpts.global) break;

    offset = m.index + m[0].length;
    input = input.substr(offset);
  }

  return matches;
}
