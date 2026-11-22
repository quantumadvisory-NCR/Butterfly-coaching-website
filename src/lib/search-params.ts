/**
 * Reading values from a page address (`?name=value`) and paging lists. A name
 * given twice (`?q=a&q=b`) arrives as a list, so these take the first value
 * rather than assuming a string.
 */

/** The first value of an address parameter, or "" when it is missing. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** A listing's page number from the address: a whole number from 1, otherwise 1 (so `?page=1.5` or `?page=abc` is page 1). */
export function pageNumber(value: string | string[] | undefined): number {
  const n = Number(firstParam(value));
  return Number.isSafeInteger(n) && n > 1 ? n : 1;
}

/** How many pages `total` items fill at `perPage` a page when page 1 also holds `extraOnFirstPage` more (at least 1). */
export function pageCount(total: number, perPage: number, extraOnFirstPage = 0): number {
  return Math.max(1, Math.ceil((total - Math.min(extraOnFirstPage, total)) / perPage));
}
