import { Role } from '../decorators/permissions.enum';
import { UUID } from '../../common/types';

/**
 * The verified identity of the caller.
 *
 * Every field is derived from the Supabase access token (or from a database
 * lookup keyed by it). Nothing here ever comes from the request body or from
 * client-supplied headers other than the bearer token itself.
 */
export interface AuthContext {
  /** `auth.users.id` — the subject of the verified JWT. */
  authUserId: UUID;
  /** `public.users.id` — the application profile owned by that auth user. */
  profileId: UUID;
  email: string;
  /** Platform role, read from `app_metadata` which only the service role can write. */
  role: Role;
  /** Retained so the API can act as the user against Supabase when required. */
  accessToken: string;
}

/** Request shape after AuthGuard has run. */
export interface AuthenticatedRequest {
  user?: AuthContext;
  headers: Record<string, string | string[] | undefined>;
}
