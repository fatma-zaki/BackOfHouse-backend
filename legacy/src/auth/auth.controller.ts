import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResendVerificationDto,
  SignUpDto,
  UpdatePasswordDto,
} from './dto/auth.dto';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthContext } from './types/auth-context';

/** Credential endpoints are rate limited far more tightly than the rest of the API. */
const CREDENTIAL_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an account' })
  @ApiResponse({ status: 201, description: 'Account created; a session is returned unless email verification is pending' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('login')
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange email and password for a session' })
  @ApiResponse({ status: 200, description: 'Session issued' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  signIn(@Body() dto: LoginDto) {
    return this.authService.signIn(dto);
  }

  @Post('refresh')
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new session' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto.refresh_token);
  }

  @Post('logout')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current session' })
  async signOut(@CurrentUser() user: AuthContext): Promise<void> {
    await this.authService.signOut(user);
  }

  @Post('password/reset')
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a password reset email' })
  @ApiResponse({ status: 202, description: 'Accepted — the response is identical for unknown addresses' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto);
    return { message: 'If an account exists for this address, a reset link has been sent' };
  }

  @Post('password')
  @Auth()
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the password of the signed-in user' })
  async updatePassword(@CurrentUser() user: AuthContext, @Body() dto: UpdatePasswordDto) {
    await this.authService.updatePassword(user, dto);
    return { message: 'Password updated' };
  }

  @Post('email/resend-verification')
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Resend the signup verification email' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto);
    return { message: 'If an account exists for this address, a verification email has been sent' };
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Identity of the signed-in user' })
  @ApiResponse({ status: 200, description: 'Account identity and platform role' })
  getCurrentUser(@CurrentUser() user: AuthContext) {
    return this.authService.getCurrentUser(user);
  }
}
