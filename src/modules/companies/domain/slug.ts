/**
 * A company's public handle: the Latin letters and digits of its name, then the first 8
 * characters of its id, so it is unique without a lookup and never changes when the name
 * is edited elsewhere. Arabic-only names give `company-<id prefix>`. The migration that
 * added slugs computes the same in SQL.
 */
export function companySlug(name: string, id: string): string {
  const latin = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${latin || 'company'}-${id.slice(0, 8).toLowerCase()}`;
}
