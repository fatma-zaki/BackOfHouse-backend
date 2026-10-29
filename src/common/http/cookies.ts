/**
 * Reads cookies from a `Cookie` header without a middleware dependency. Values
 * are URI-decoded; a malformed value is skipped rather than throwing.
 */
export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) {
    return cookies;
  }
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    if (!name || name in cookies) continue;
    try {
      cookies[name] = decodeURIComponent(raw);
    } catch {
      // malformed percent-encoding: ignore this cookie
    }
  }
  return cookies;
}
