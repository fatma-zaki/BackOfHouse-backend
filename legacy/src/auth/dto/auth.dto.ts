import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const PASSWORD_MESSAGE = 'password must contain an uppercase letter, a lowercase letter and a digit';

const normaliseEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SignUpDto {
  @ApiProperty({ example: 'chef@example.com' })
  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Sunrise-Kitchen-2026', minLength: PASSWORD_MIN })
  @IsString()
  @MinLength(PASSWORD_MIN)
  @MaxLength(PASSWORD_MAX)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password!: string;

  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Okonkwo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'chef@example.com' })
  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Sunrise-Kitchen-2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token returned by login' })
  @IsString()
  @MinLength(10)
  @MaxLength(2048)
  refresh_token!: string;
}

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'chef@example.com' })
  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'Sunset-Kitchen-2026', minLength: PASSWORD_MIN })
  @IsString()
  @MinLength(PASSWORD_MIN)
  @MaxLength(PASSWORD_MAX)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'chef@example.com' })
  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
