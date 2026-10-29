/**
 * Reads cookies from a `Cookie` header without a middleware dependency. Values
 * are URI-decoded; a malformed value is skipped rather than throwing; the first
 * occurrence of a name wins. Returns a Map, so a client-chosen name such as
 * `__proto__` can never write to an object prototype (CodeQL js/remote-property-injection).
 */
export function parseCookies(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) {
    return cookies;
  }
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    if (!name || cookies.has(name)) continue;
    try {
      cookies.set(name, decodeURIComponent(raw));
    } catch {
      // malformed percent-encoding: ignore this cookie
    }
  }
  return cookies;
}
