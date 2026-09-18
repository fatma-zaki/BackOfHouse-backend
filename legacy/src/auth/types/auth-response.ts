import { Role } from '../decorators/permissions.enum';
import { UUID } from '../../common/types';

export interface SessionPayload {
  access_token: string;
  refresh_token: string;
  /** Seconds until `access_token` expires. */
  expires_in: number;
  token_type: 'bearer';
}

export interface AuthenticatedUserPayload {
  id: UUID;
  auth_user_id: UUID;
  email: string;
  role: Role;
  email_verified: boolean;
}

export interface SignUpResult {
  user: AuthenticatedUserPayload;
  /** Null when the project requires email confirmation before the first login. */
  session: SessionPayload | null;
  email_verification_required: boolean;
}

export interface LoginResult {
  user: AuthenticatedUserPayload;
  session: SessionPayload;
}
