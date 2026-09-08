/**
 * Reading a boolean preference back out of `localStorage`, where it is stored as
 * the string `"true"` / `"false"`. Anything else - a legacy value, a corrupted
 * entry, or nothing at all - falls back to the caller's default.
 */

/** Coerce a stored flag string to a boolean, using `fallback` for `null` / unknown values. */
export const coerceFlag = (raw: string | null | undefined, fallback: boolean): boolean => {
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return fallback;
};
