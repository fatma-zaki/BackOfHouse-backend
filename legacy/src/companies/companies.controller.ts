import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { AddMemberDto, CreateCompanyDto, UpdateCompanyDto, UpdateMemberRoleDto } from './dto/company.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

/**
 * Company endpoints combine two checks: the RBAC permission on the route, and a
 * membership check inside the service for the specific company being touched.
 */
@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Auth(Permission.COMPANY_CREATE)
  @ApiOperation({ summary: 'Create a company; the creator becomes its first administrator' })
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user, dto);
  }

  @Get()
  @Auth(Permission.COMPANY_READ)
  @ApiOperation({ summary: 'List active companies' })
  async findAll(@Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.companiesService.findAll(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get(':id')
  @Auth(Permission.COMPANY_READ)
  @ApiOperation({ summary: 'Get a company by id' })
  findById(@Param('id', ParseUuidPipe) id: UUID) {
    return this.companiesService.findById(id);
  }

  @Patch(':id')
  @Auth(Permission.COMPANY_READ)
  @ApiOperation({ summary: 'Update a company (administrators of that company only)' })
  update(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.companiesService.update(id, dto, user);
  }

  @Delete(':id')
  @Auth(Permission.COMPANY_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a company (administrators of that company only)' })
  async remove(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.companiesService.remove(id, user);
  }

  @Get(':id/members')
  @Auth(Permission.COMPANY_READ)
  @ApiOperation({ summary: 'List members of a company (members only)' })
  listMembers(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.companiesService.listMembers(id, user);
  }

  @Post(':id/members')
  @Auth(Permission.COMPANY_READ)
  @ApiOperation({ summary: 'Add a member (administrators of that company only)' })
  addMember(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.companiesService.addMember(id, dto, user);
  }

  @Patch(':id/members/:userId')
  @Auth(Permission.COMPANY_READ)
  @ApiOperation({ summary: 'Change a member role (administrators of that company only)' })
  updateMemberRole(
    @Param('id', ParseUuidPipe) id: UUID,
    @Param('userId', ParseUuidPipe) userId: UUID,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.companiesService.updateMemberRole(id, userId, dto, user);
  }

  @Delete(':id/members/:userId')
  @Auth(Permission.COMPANY_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member (company administrator, or the member themselves)' })
  async removeMember(
    @Param('id', ParseUuidPipe) id: UUID,
    @Param('userId', ParseUuidPipe) userId: UUID,
    @CurrentUser() user: AuthContext,
  ): Promise<void> {
    await this.companiesService.removeMember(id, userId, user);
  }
}
