/**
 * `map[key]` restricted to own properties. Runtime page/CMS data supplies the
 * key, and a plain bracket lookup would also reach inherited
 * `Object.prototype` members — `"toString"` or `"constructor"` must resolve to
 * "unknown", not to a built-in function React then tries to render or call.
 */
export function ownProperty<T>(
  map: Record<string, T> | undefined,
  key: string
): T | undefined {
  return map != null && Object.hasOwn(map, key) ? map[key] : undefined;
}
