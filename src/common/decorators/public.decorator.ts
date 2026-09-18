import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'boh:is_public';

/**
 * Marks a route as reachable without a token (api-map.md §1.1 "Public").
 * Every other route is denied by default (security-and-audit.md §3).
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
