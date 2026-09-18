import { IsInt, IsString, IsUUID, MaxLength, Min, Max, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Administrative points adjustment. Requires POINTS_ADJUST, which only a
 * platform admin holds — a member can never name themselves as the recipient
 * of an award through the API.
 */
export class AdjustPointsDto {
  @ApiProperty({ description: 'Profile id (users.id) receiving the adjustment' })
  @IsUUID('4')
  user_id!: string;

  @ApiProperty({ example: 250, description: 'Positive to credit, negative to debit' })
  @IsInt()
  @Min(-100000)
  @Max(100000)
  @NotEquals(0)
  amount!: number;

  @ApiProperty({ example: 'Goodwill credit after a support ticket' })
  @IsString()
  @MaxLength(500)
  description!: string;
}
