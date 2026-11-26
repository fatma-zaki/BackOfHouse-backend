/**
 * Types for the admin API, generated from the backend's contract
 * (contracts/admin/openapi.yaml → contracts/admin/types/admin-api.d.ts,
 * regenerated with `npm run contract:types` at the repo root).
 *
 * Import from here, not from the generated file, so the path is in one place:
 *
 *   import type { AdminSchema } from '@/lib/admin-api'
 *   type Event = AdminSchema<'Event'>
 */
import type { components, operations, paths } from '@contracts/admin/types/admin-api'

export type { components, operations, paths }

/** A schema from the admin contract by name, e.g. `AdminSchema<'Event'>`. */
export type AdminSchema<Name extends keyof components['schemas']> = components['schemas'][Name]
