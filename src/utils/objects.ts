import camelCase from "lodash/camelCase.js"
import mapKeys from "lodash/mapKeys.js"
import omit from "lodash/omit.js"
import pickBy from "lodash/pickBy.js"

export { omit, pickBy }

type NullToUndefined<T> = T extends null ? undefined : T
type NoNullProperties<T> = {
  [P in keyof T]: NullToUndefined<T[P]>
}

/**
 * Remove all the null properties from an object.
 *
 * @param obj Any object.
 * @returns The input with nulls removed.
 */
export const removeNulls = <T extends Record<string, unknown>>(
  obj: T
): NoNullProperties<T> =>
  pickBy(obj, (value) => value !== null) as NoNullProperties<T>

export const removeUndefined = <T extends Record<string, unknown>>(obj: T) =>
  pickBy(obj, (value) => value !== undefined)

export const camelCaseKeys = <T extends Record<string, unknown>>(obj: T) =>
  mapKeys(obj, (_, k) => camelCase(k))
