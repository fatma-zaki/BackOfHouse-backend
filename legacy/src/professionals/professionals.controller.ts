import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @Auth(Permission.PROFESSIONAL_WRITE_OWN)
  @ApiOperation({ summary: 'Create own professional profile' })
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateProfessionalDto) {
    return this.professionalsService.createOwn(user, dto);
  }

  @Get()
  @Auth(Permission.PROFESSIONAL_READ)
  @ApiOperation({ summary: 'Search the public talent directory' })
  async findAll(@Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.professionalsService.findAll(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get('me')
  @Auth(Permission.PROFESSIONAL_READ)
  @ApiOperation({ summary: 'Own professional profile' })
  getOwn(@CurrentUser() user: AuthContext) {
    return this.professionalsService.getOwn(user);
  }

  @Get('user/:userId')
  @Auth(Permission.PROFESSIONAL_READ)
  @ApiOperation({ summary: 'Professional profile of a member' })
  findByUserId(@Param('userId', ParseUuidPipe) userId: UUID, @CurrentUser() user: AuthContext) {
    return this.professionalsService.findByUserId(userId, user);
  }

  @Get(':id')
  @Auth(Permission.PROFESSIONAL_READ)
  @ApiOperation({ summary: 'Get a professional profile by id' })
  findById(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.professionalsService.findById(id, user);
  }

  @Patch(':id')
  @Auth(Permission.PROFESSIONAL_WRITE_OWN)
  @ApiOperation({ summary: 'Update own professional profile' })
  update(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpdateProfessionalDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.professionalsService.updateOwn(id, dto, user);
  }

  @Delete(':id')
  @Auth(Permission.PROFESSIONAL_WRITE_OWN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own professional profile' })
  async remove(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.professionalsService.removeOwn(id, user);
  }
}
