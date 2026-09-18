import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Auth(Permission.USER_READ)
  @ApiOperation({ summary: 'Own profile, including private fields' })
  @ApiOkResponse({ description: 'The signed-in user profile' })
  getMe(@CurrentUser() user: AuthContext) {
    return this.usersService.getOwnProfile(user);
  }

  @Patch('me')
  @Auth(Permission.USER_UPDATE_OWN)
  @ApiOperation({ summary: 'Update own profile' })
  updateMe(@CurrentUser() user: AuthContext, @Body() dto: UpdateUserDto) {
    return this.usersService.updateOwnProfile(user, dto);
  }

  @Get()
  @Auth(Permission.USER_READ)
  @ApiOperation({ summary: 'List members (public fields only)' })
  async list(@Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.usersService.listPublic(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get(':id')
  @Auth(Permission.USER_READ)
  @ApiOperation({ summary: 'Public profile of a member' })
  findById(@Param('id', ParseUuidPipe) id: UUID) {
    return this.usersService.findPublicById(id);
  }
}
