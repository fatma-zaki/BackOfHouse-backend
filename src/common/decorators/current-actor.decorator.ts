import { createParamDecorator } from '@nestjs/common';
import type { Actor } from '../context/actor';
import { RequestContext } from '../context/request-context';

/**
 * The actor resolved by SurfaceAuthGuard. Controllers pass it into service calls
 * explicitly; services never read HTTP state (execution-plan.md §1.4).
 */
export const CurrentActor = createParamDecorator((): Actor | undefined => RequestContext.actor());
