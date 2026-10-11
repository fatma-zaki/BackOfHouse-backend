// Phase order and the path → phase rules used to tag operations with `x-phase`
// (docs/execution-plan.md §3–§4). After tagging, `x-phase` in the contract files
// is the source of truth; these rules are only used by the one-time converters.

export const PHASES = ['0', '1', '2', '3a', '3b', '4', '5', '6', '7', '8', '9'];

export function phaseIndex(phase) {
  const index = PHASES.indexOf(String(phase));
  if (index === -1) throw new Error(`Unknown phase "${phase}"`);
  return index;
}

/** Admin surface, paths relative to /api/admin/v1 (after the D1 and D5 renames). */
export const ADMIN_RULES = [
  ['0', /^GET \/ping$/],
  ['1', /^\w+ \/(settings|taxonomy)\b/],
  ['2', /^\w+ \/(auth|team|roles)\b/],
  ['2', /^GET \/me$/],
  ['3b', /^GET \/notifications$/],
  ['4', /^\w+ \/(verification-requests|claims|moderation)\b/],
  ['4', /^\w+ \/\{subject\}\/\{id\}\/notes$/],
  ['4', /^\w+ \/users(\/bulk|\/\{id\}(\/(suspend|unsuspend|password-reset|verification\/remove))?)?$/],
  ['4', /^\w+ \/companies(\/\{id\}(\/(team|suspend|verification\/remove))?)?$/],
  ['5', /^\w+ \/(opportunities|applications|supplier-requests)\b/],
  ['5', /^GET \/(companies|users)\/\{id\}\/(opportunities|applications)$/],
  ['6', /^\w+ \/(events|points|earning-rules|rewards|redemptions)\b/],
  ['6', /^GET \/users\/\{id\}\/(points|events)$/],
  ['7', /^\w+ \/(articles|support|broadcasts|imports)\b/],
  ['8', /^\w+ \/(overview|my-work|search|analytics|reports|exports|scheduled-exports|saved-reports|audit-log)\b/],
  ['8', /^POST \/users\/\{id\}\/data-requests$/],
];

/** App surface, paths relative to /api/app/v1 (Flutter contract, D1). */
export const APP_RULES = [
  ['0', /^GET \/(ping|meta\/app-version)$/],
  ['2', /^\w+ \/auth\//],
  ['2', /^GET \/me$/],
  ['3a', /^\w+ \/me\/profile$/],
  ['3a', /^\w+ \/professionals/],
  ['3a', /^\w+ \/companies(\/\{id\}(\/(follow|projects))?)?$/],
  ['3a', /^\w+ \/company(\/(stats|projects.*))?$/],
  ['3b', /^\w+ \/me\/verification/],
  ['3b', /^\w+ \/me\/notifications/],
  ['5', /^\w+ \/opportunities/],
  ['5', /^GET \/companies\/\{id\}\/opportunities$/],
  ['5', /^\w+ \/me\/applications/],
  ['5', /^\w+ \/company\/(opportunities|applicants|supplier-requests|supplier-responses)/],
  ['6', /^\w+ \/events/],
  ['6', /^\w+ \/me\/points/],
  ['6', /^\w+ \/rewards/],
  ['6', /^GET \/discover\/counts$/],
  ['7', /^\w+ \/news/],
];

/** Returns the single phase whose rule matches "METHOD /path"; throws on 0 or several. */
export function assignPhase(rules, operation) {
  const hits = [...new Set(rules.filter(([, re]) => re.test(operation)).map(([phase]) => phase))];
  if (hits.length !== 1) throw new Error(`${operation} matched ${hits.length} phases (${hits.join(', ')})`);
  return hits[0];
}

export const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** Lists [method, path, operation] for every operation of a parsed OpenAPI document. */
export function operations(document) {
  const result = [];
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of METHODS) {
      if (item[method]) result.push([method, path, item[method]]);
    }
  }
  return result;
}
