import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../audit.types';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListAuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ example: 'company' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entity_type?: string;

  @ApiPropertyOptional({ description: 'Profile id of the actor' })
  @IsOptional()
  @IsUUID('4')
  actor_id?: string;
}
