// One-time conversion: web team hand-off spec → contracts/admin/openapi.yaml.
// Applies D1 (vocabulary), D2 (snake_case, UPPER_SNAKE enums), D3 (error body), D4 (prefix,
// envelope), D5 (Google Workspace OIDC, cookie session) and tags every operation with x-phase.
// After the first run, contracts/admin/openapi.yaml is edited by hand; this script is kept for
// traceability. Usage: node scripts/contracts/convert-admin-handoff.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { ADMIN_RULES, assignPhase, METHODS } from './phases.mjs';

const SOURCE = 'docs/admin/openapi/openapi.yaml';
const TARGET = 'contracts/admin/openapi.yaml';
const source = yaml.load(readFileSync(SOURCE, 'utf8'));

// ---------------------------------------------------------------- naming helpers
const snake = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
const vocab = (name) => name.replace(/listings/g, 'opportunities').replace(/listing/g, 'opportunity');
const fieldName = (name) => vocab(snake(name));
const schemaName = (name) => name.replace(/Listings/g, 'Opportunities').replace(/Listing/g, 'Opportunity');
const permission = (key) => key.replace(/^listings\./, 'opportunities.');

const ENUM_ALIASES = { coop: 'CO_OP', volunteer: 'VOLUNTEERING' };
const OPPORTUNITY_STATUS_ALIASES = { pending_review: 'IN_REVIEW', live: 'PUBLISHED' };
const KEEP_LOWERCASE = new Set(['en', 'ar']);

function enumValue(value, statusEnum) {
  if (typeof value !== 'string' || KEEP_LOWERCASE.has(value)) return value;
  if (statusEnum && OPPORTUNITY_STATUS_ALIASES[value]) return OPPORTUNITY_STATUS_ALIASES[value];
  if (ENUM_ALIASES[value]) return ENUM_ALIASES[value];
  if (/^[a-z][a-z0-9_]*$/.test(value)) return vocab(value).toUpperCase();
  if (/^[a-z_]+\.[a-z_.]+$/.test(value)) return permission(value);
  return value;
}

/** Recursively renames schema properties, required lists, enums and $refs. */
function convertSchema(node, keepEnums = false) {
  if (Array.isArray(node)) return node.map((n) => convertSchema(n, keepEnums));
  if (!node || typeof node !== 'object') return node;
  const out = {};
  const statusEnum = Array.isArray(node.enum) && node.enum.includes('live') && node.enum.includes('changes_requested');
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref') out[key] = value.replace(/schemas\/(\w+)/, (_, n) => `schemas/${schemaName(n)}`);
    else if (key === 'properties')
      out[key] = Object.fromEntries(Object.entries(value).map(([k, v]) => [fieldName(k), convertSchema(v)]));
    else if (key === 'required' && Array.isArray(value)) out[key] = value.map(fieldName);
    else if (key === 'enum') out[key] = keepEnums ? value : value.map((v) => enumValue(v, statusEnum));
    else if (key === 'description') out[key] = convertText(value);
    else if (key === 'default' && Array.isArray(node.enum)) out[key] = enumValue(value, statusEnum);
    else if (key === 'example' || key === 'examples') out[key] = convertExample(value);
    else out[key] = convertSchema(value, keepEnums);
  }
  return out;
}

function convertExample(value) {
  if (Array.isArray(value)) return value.map(convertExample);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [fieldName(k), convertExample(v)]));
}

function convertText(text) {
  return typeof text === 'string'
    ? text
        .replace(/`listings\.(view|review)`/g, '`opportunities.$1`')
        .replace(/LISTING_NOT_EDITABLE/g, 'NOT_EDITABLE')
        .replace(/\blistings\b/g, 'opportunities')
        .replace(/\bListings\b/g, 'Opportunities')
        .replace(/\blisting\b/g, 'opportunity')
        .replace(/\bListing\b/g, 'Opportunity')
    : text;
}

// ---------------------------------------------------------------- shared components
const ERROR_SCHEMA = {
  type: 'object',
  required: ['code', 'message', 'trace_id'],
  description: 'Error body shared by both surfaces (ADR-008, D3). Codes: docs/error-codes.md.',
  properties: {
    code: {
      type: 'string',
      description:
        'Stable machine-readable code from docs/error-codes.md, e.g. VALIDATION_FAILED, NOT_STAFF, SERVER_ERROR',
    },
    message: { type: 'string', description: 'For logs only; the client shows its own localised copy.' },
    trace_id: { type: 'string' },
    errors: {
      type: 'object',
      description: 'Field errors keyed by request field name (422 only)',
      additionalProperties: { type: 'array', items: { type: 'string' } },
    },
  },
};
const errorResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

// ---------------------------------------------------------------- operations
const DROPPED = new Set([
  'post /admin/auth/login',
  'post /admin/auth/mfa/verify',
  'post /admin/auth/mfa/confirm',
  'get /admin/invites/{token}',
  'post /admin/invites/{token}/accept',
]);

const PATH_RENAMES = [
  [/^\/admin\/listings/, '/admin/opportunities'],
  [/^\/admin\/companies\/\{id\}\/listings$/, '/admin/companies/{id}/opportunities'],
  [/^\/admin\/analytics\/top-listings$/, '/admin/analytics/top-opportunities'],
];

function wrapSuccess(schema, components) {
  const resolved = schema.$ref ? components.schemas[schema.$ref.split('/').pop()] : schema;
  if (resolved?.properties?.items && resolved?.properties?.meta) {
    const { items, ...rest } = resolved.properties;
    resolved.properties = { data: items, ...rest };
    resolved.required = (resolved.required ?? []).map((r) => (r === 'items' ? 'data' : r));
    return schema;
  }
  return { type: 'object', required: ['data'], properties: { data: schema } };
}

const components = {
  schemas: Object.fromEntries(
    Object.entries(source.components.schemas)
      .filter(([name]) => name !== 'Problem')
      .map(([name, schema]) => [schemaName(name), convertSchema(schema)]),
  ),
};
components.schemas.Error = ERROR_SCHEMA;
// D5: no MFA flag on staff; Google Workspace enforces 2-Step Verification.
delete components.schemas.AdminUser.properties.mfa_enabled;

const paths = {};
for (const [rawPath, item] of Object.entries(source.paths)) {
  if (!rawPath.startsWith('/admin')) continue;
  let path = rawPath;
  for (const [from, to] of PATH_RENAMES) path = path.replace(from, to);
  for (const method of METHODS) {
    const op = item[method];
    if (!op || DROPPED.has(`${method} ${rawPath}`)) continue;
    const relative = path.replace(/^\/admin/, '');
    const converted = {
      tags: (op.tags ?? []).map(convertText),
      summary: convertText(op.summary),
      operationId: vocab(op.operationId.replace(/Listings/g, 'Opportunities').replace(/Listing/g, 'Opportunity')),
      ...(op.description ? { description: convertText(op.description) } : {}),
      'x-phase': assignPhase(ADMIN_RULES, `${method.toUpperCase()} ${relative}`),
      ...(op['x-permission'] ? { 'x-permission': permission(op['x-permission']) } : {}),
      ...(op['x-screens'] ? { 'x-screens': op['x-screens'] } : {}),
      ...(op.parameters
        ? {
            parameters: op.parameters.map((p) =>
              p.$ref
                ? p
                : {
                    ...p,
                    name: p.in === 'query' ? fieldName(p.name) : p.name,
                    // Path values are URL segments (e.g. /users/{id}/notes): keep them lowercase.
                    schema: convertSchema(p.schema, p.in === 'path'),
                  },
            ),
          }
        : {}),
      ...(op.requestBody ? { requestBody: convertSchema(op.requestBody) } : {}),
      responses: {},
      security: ['get'].includes(method) ? [{ adminSession: [] }] : [{ adminSession: [], csrfToken: [] }],
    };
    for (const [status, response] of Object.entries(op.responses)) {
      const r = convertSchema(response);
      const json = r.content?.['application/json'];
      if (/^2/.test(status) && json?.schema) json.schema = wrapSuccess(json.schema, components);
      if (r.content?.['application/problem+json']) {
        r.content = { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } };
      }
      converted.responses[status] = r;
    }
    (paths[relative] ??= {})[method] = converted;
  }
}

// D5: Google Workspace OIDC replaces password, TOTP and invite-token routes.
paths['/auth/oidc/start'] = {
  get: {
    tags: ['Admin auth'],
    summary: 'Start Google Workspace sign-in',
    operationId: 'getAdminAuthOidcStart',
    description:
      'Redirects to Google with an OIDC authorization request (code flow + PKCE, `hd` set to the Workspace domain). ' +
      'Stores `state`, `nonce` and the PKCE verifier in a short-lived httpOnly cookie.',
    'x-phase': '2',
    security: [],
    parameters: [
      {
        name: 'return_to',
        in: 'query',
        required: false,
        description: 'Admin web path to open after sign-in',
        schema: { type: 'string' },
      },
    ],
    responses: { 302: { description: 'Redirect to Google' }, 429: errorResponse('RATE_LIMITED') },
  },
};
paths['/auth/oidc/callback'] = {
  get: {
    tags: ['Admin auth'],
    summary: 'Google Workspace sign-in callback',
    operationId: 'getAdminAuthOidcCallback',
    description:
      'Exchanges the code, verifies the ID token (issuer, audience, nonce, expiry), then requires BOTH the `hd` claim ' +
      'and the verified email domain to equal the Workspace domain. Activates an `INVITED` staff account on first sign-in. ' +
      'Sets the `__Host-boh_admin` session cookie (30-min idle, 12 h absolute) and redirects to the admin web app. ' +
      'Audited as `admin.sign_in`.',
    'x-phase': '2',
    security: [],
    parameters: [
      { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
      { name: 'state', in: 'query', required: true, schema: { type: 'string' } },
    ],
    responses: {
      302: { description: 'Signed in; redirect to the admin web app with the session cookie set' },
      401: errorResponse('`UNAUTHENTICATED`: invalid state, nonce or ID token'),
      403: errorResponse('`NOT_STAFF`: not our Workspace domain, or no active staff account for this email'),
    },
  },
};
paths['/auth/logout'].post.description = 'Deletes the server-side session and clears the cookie.';
paths['/auth/logout'].post.security = [{ adminSession: [], csrfToken: [] }];
paths['/ping'] = {
  get: {
    tags: ['Admin meta'],
    summary: 'Surface check',
    operationId: 'getAdminPing',
    'x-phase': '0',
    security: [],
    responses: {
      200: {
        description: 'The admin surface is mounted',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['data'],
              properties: {
                data: {
                  type: 'object',
                  required: ['status', 'surface'],
                  properties: {
                    status: { type: 'string', enum: ['OK'] },
                    surface: { type: 'string', enum: ['admin'] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
const teamInvite = paths['/team/invites'].post;
teamInvite.description =
  'Creates a staff account with status `INVITED` (name, work email on the Workspace domain, role). The first Google sign-in ' +
  'with that email activates it. No invite link or token. 422 `EMAIL_DOMAIN_NOT_ALLOWED`.\n\n**Permission:** `team.manage`';
paths['/team/invites/{id}'].delete.description =
  'Cancels an invitation that has not been used yet.\n\n**Permission:** `team.manage`';
paths['/team/{id}'].patch.description =
  "Changes role or status. A role change or `DISABLED` deletes the person's sessions immediately. 409 `LAST_SUPER_ADMIN`.\n\n**Permission:** `team.manage`";

// ---------------------------------------------------------------- components: responses, params, security
components.responses = {
  BadRequest: errorResponse('`BAD_REQUEST`'),
  Unauthorized: errorResponse('`UNAUTHENTICATED`: no session, or the session expired (30-min idle, 12 h absolute)'),
  Forbidden: errorResponse('`FORBIDDEN`, `PERSONAL_DATA_FORBIDDEN` or `NOT_STAFF`'),
  NotFound: errorResponse('`NOT_FOUND`'),
  Conflict: errorResponse('State conflict, e.g. `NOT_EDITABLE`, `INVALID_TRANSITION`, `LAST_SUPER_ADMIN`'),
  Unprocessable: errorResponse('`VALIDATION_FAILED` (with `errors`) or a business rule, e.g. `MONTHLY_CAP_REACHED`'),
  ServerError: errorResponse('`SERVER_ERROR`: unexpected failure, no details exposed (any operation, 5xx)'),
};
components.parameters = source.components.parameters;
components.securitySchemes = {
  adminSession: {
    type: 'apiKey',
    in: 'cookie',
    name: '__Host-boh_admin',
    description: 'Opaque server-side session (ADR-032). httpOnly, Secure, SameSite=Strict. 30-min idle, 12 h absolute.',
  },
  csrfToken: {
    type: 'apiKey',
    in: 'header',
    name: 'X-CSRF-Token',
    description: 'Required on POST, PUT, PATCH and DELETE (double-submit token issued with the session).',
  },
};

// ---------------------------------------------------------------- prune unreachable schemas
const reachable = new Set();
const visit = (node) => {
  if (Array.isArray(node)) return node.forEach(visit);
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && value.startsWith('#/components/schemas/')) {
      const name = value.split('/').pop();
      if (!reachable.has(name)) {
        reachable.add(name);
        visit(components.schemas[name]);
      }
    } else visit(value);
  }
};
visit(paths);
visit(components.responses);
components.schemas = Object.fromEntries(Object.entries(components.schemas).filter(([name]) => reachable.has(name)));

// ---------------------------------------------------------------- check and write
const missing = [];
const checkRefs = (node) => {
  if (Array.isArray(node)) return node.forEach(checkRefs);
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref') {
      const [, kind, name] = value.match(/^#\/components\/(\w+)\/(\w+)$/) ?? [];
      if (!components[kind]?.[name]) missing.push(value);
    } else checkRefs(value);
  }
};
checkRefs(paths);
checkRefs(components);
if (missing.length) throw new Error(`Unresolved $refs: ${[...new Set(missing)].join(', ')}`);

const sortedPaths = Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)));
const document = {
  openapi: '3.1.0',
  info: {
    title: 'Back of House — Admin API',
    version: '1.0.0',
    description:
      'Contract for the admin back-office (web). Source of truth for the admin surface (ADR-031).\n\n' +
      'Conventions: snake_case JSON; enum values UPPER_SNAKE_CASE; single resources `{ data }`, lists `{ data, meta }` with ' +
      '`page`, `page_size`, `total`, `total_pages`; errors `{ code, message, trace_id, errors }` (docs/error-codes.md); ' +
      'bilingual content as `{ en, ar }`.\n\n' +
      'Every operation carries `x-phase` (docs/execution-plan.md) and, where it is permission-gated, `x-permission`. ' +
      'Authentication: Google Workspace via OIDC, then an httpOnly session cookie (ADR-032).',
  },
  servers: [{ url: '/api/admin/v1' }],
  security: [{ adminSession: [] }],
  tags: (source.tags ?? []).filter((t) => /^Admin/.test(t.name)).map((t) => ({ ...t, name: convertText(t.name) })),
  paths: sortedPaths,
  components,
};

const header =
  '# Admin surface contract (ADR-031). Source of truth: edit this file first, then the code.\n' +
  '# First generated 2026-10-11 from docs/admin/openapi/openapi.yaml by scripts/contracts/convert-admin-handoff.mjs.\n';
writeFileSync(TARGET, header + yaml.dump(document, { noRefs: true, lineWidth: 120, quotingType: "'" }));
const count = Object.values(sortedPaths).reduce((n, item) => n + Object.keys(item).length, 0);
console.log(`Wrote ${TARGET}: ${count} operations, ${Object.keys(components.schemas).length} schemas`);
