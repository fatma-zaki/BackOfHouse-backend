import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { ListAuditQueryDto } from './dto/list-audit.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Permission } from '../auth/decorators/permissions.enum';
import { paginate, parsePagination } from '../common/pagination/pagination.dto';

@ApiTags('Audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Auth(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Search the audit trail (platform administrators only)' })
  async list(@Query() query: ListAuditQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.auditService.list(pagination, {
      action: query.action,
      entityType: query.entity_type,
      actorId: query.actor_id,
    });
    return paginate(data, pagination.page, pagination.limit, total);
  }
}
