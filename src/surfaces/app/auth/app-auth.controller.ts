import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { RequestContext } from '../../../common/context/request-context';
import { Public } from '../../../common/decorators/public.decorator';
import { CompaniesService } from '../../../modules/companies';
import { MemberAuthService, PhoneSignInService } from '../../../modules/identity';
import { AppUserAssembler, AppUserDto, SessionDto } from './app-user.assembler';
import { memberOf } from './member-token.resolver';

/** Per IP, per minute (security-and-audit.md §5). Phone codes also have per-number limits. */
const per = (limit: number) => ({ default: { limit, ttl: 60_000 } });

const OBJECT_BODY = { schema: { type: 'object' } };
const SESSION = {
  description: 'Signed in',
  schema: { type: 'object', required: ['data'], properties: { data: { type: 'object' } } },
};

/**
 * Member sign-in (contracts/app /auth/* and GET /me; ADR-003 amended, BQ-78).
 * Request bodies are validated in the services (422 with field errors).
 */
@ApiTags('Auth')
@Controller()
export class AppAuthController {
  constructor(
    private readonly auth: MemberAuthService,
    private readonly phone: PhoneSignInService,
    private readonly companies: CompaniesService,
    private readonly users: AppUserAssembler,
  ) {}

  @Public()
  @Throttle(per(10))
  @Post('auth/register')
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(SESSION)
  async register(@Body() body: unknown): Promise<SessionDto> {
    const isCompany = (body as { account_type?: unknown } | null)?.account_type === 'COMPANY';
    const tokens = isCompany ? await this.companies.register(body) : await this.auth.register(body);
    return this.users.session(tokens);
  }

  @Public()
  @Throttle(per(10))
  @Post('auth/login')
  @HttpCode(200)
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(SESSION)
  async login(@Body() body: unknown): Promise<SessionDto> {
    return this.users.session(await this.auth.login(body));
  }

  @Public()
  @Throttle(per(10))
  @Post('auth/phone/code')
  @HttpCode(204)
  @ApiBody(OBJECT_BODY)
  @ApiNoContentResponse({ description: 'Code sent' })
  async phoneCode(@Body() body: unknown, @Req() req: Request): Promise<void> {
    await this.phone.sendCode(body, { ip: req.ip, locale: RequestContext.locale() });
  }

  @Public()
  @Throttle(per(10))
  @Post('auth/phone/verify')
  @HttpCode(200)
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(SESSION)
  async phoneVerify(@Body() body: unknown): Promise<SessionDto> {
    return this.users.session(await this.phone.verify(body));
  }

  @Public()
  @Throttle(per(30))
  @Post('auth/refresh')
  @HttpCode(200)
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(SESSION)
  async refresh(@Body() body: unknown): Promise<SessionDto> {
    return this.users.session(await this.auth.refresh(body));
  }

  @Post('auth/logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiNoContentResponse({ description: 'Signed out' })
  async logout(@Req() req: Request): Promise<void> {
    await this.auth.logout(memberOf(req));
  }

  @Public()
  @Throttle(per(5))
  @Post('auth/forgot-password')
  @HttpCode(204)
  @ApiBody(OBJECT_BODY)
  @ApiNoContentResponse({ description: 'Accepted' })
  async forgotPassword(@Body() body: unknown): Promise<void> {
    await this.auth.forgotPassword(body);
  }

  @Public()
  @Throttle(per(10))
  @Post('auth/reset-password')
  @HttpCode(204)
  @ApiBody(OBJECT_BODY)
  @ApiNoContentResponse({ description: 'Password changed' })
  async resetPassword(@Body() body: unknown): Promise<void> {
    await this.auth.resetPassword(body);
  }

  /** Called on launch to restore the session. */
  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'OK', schema: { type: 'object', properties: { data: { type: 'object' } } } })
  me(@Req() req: Request): Promise<AppUserDto> {
    return this.users.user(memberOf(req).userId);
  }
}
