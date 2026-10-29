import { Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiNoContentResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import type { StaffActor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { UnauthenticatedError } from '../../../common/errors';
import { AppConfig } from '../../../config/app.config';
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE, StaffSignInService } from '../../../modules/access';
import { ADMIN_SESSION_ID } from './staff-session.resolver';

/** 20 requests a minute per IP on the sign-in routes (ADR-032). */
const SIGN_IN_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

/**
 * Staff sign-in with Google Workspace (contracts/admin: /auth/oidc/start,
 * /auth/oidc/callback, /auth/logout). The callback sets two `__Host-` cookies:
 * the httpOnly session and the CSRF token the admin web app echoes in X-CSRF-Token.
 */
@ApiTags('Admin auth')
@Controller('auth')
export class AdminAuthController {
  constructor(
    private readonly signIn: StaffSignInService,
    private readonly config: AppConfig,
  ) {}

  @Public()
  @Throttle(SIGN_IN_THROTTLE)
  @Get('oidc/start')
  @ApiQuery({ name: 'return_to', required: false, description: 'Admin web path to open after sign-in' })
  @ApiResponse({ status: 302, description: 'Redirect to Google' })
  async start(@Query('return_to') returnTo: string | undefined, @Res() res: Response): Promise<void> {
    res.redirect(302, await this.signIn.start(returnTo));
  }

  @Public()
  @Throttle(SIGN_IN_THROTTLE)
  @Get('oidc/callback')
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  @ApiResponse({ status: 302, description: 'Signed in; redirect to the admin web app with the session cookie set' })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!code || !state) {
      throw new UnauthenticatedError('Sign-in expired or invalid; start again');
    }
    const result = await this.signIn.complete({ code, state, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    const maxAge = result.expiresAt.getTime() - Date.now();
    res.cookie(ADMIN_SESSION_COOKIE, result.token, { ...this.cookieOptions(maxAge), httpOnly: true });
    res.cookie(ADMIN_CSRF_COOKIE, result.csrfToken, { ...this.cookieOptions(maxAge), httpOnly: false });
    res.redirect(302, `${this.config.staffAuth.adminWebUrl ?? ''}${result.returnTo}`);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiCookieAuth('adminSession')
  @ApiNoContentResponse({ description: 'Signed out; cookies cleared' })
  async logout(
    @CurrentActor() actor: StaffActor,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = (req as Request & Record<string, unknown>)[ADMIN_SESSION_ID] as string;
    await this.signIn.signOut(actor, sessionId);
    res.clearCookie(ADMIN_SESSION_COOKIE, this.cookieOptions());
    res.clearCookie(ADMIN_CSRF_COOKIE, this.cookieOptions());
  }

  /** `__Host-` cookies: Secure, Path=/, no Domain. SameSite=Strict blocks cross-site sends. */
  private cookieOptions(maxAge?: number): CookieOptions {
    return { secure: true, sameSite: 'strict', path: '/', ...(maxAge !== undefined ? { maxAge } : {}) };
  }
}
