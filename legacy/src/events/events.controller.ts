import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Auth(Permission.EVENT_CREATE)
  @ApiOperation({ summary: 'Create an event (optionally hosted by a company you belong to)' })
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user, dto);
  }

  @Get()
  @Auth(Permission.EVENT_READ)
  @ApiOperation({ summary: 'List published events' })
  async findAll(@Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.eventsService.findAll(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get(':id')
  @Auth(Permission.EVENT_READ)
  @ApiOperation({ summary: 'Get an event by id' })
  findById(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.eventsService.findById(id, user);
  }

  @Patch(':id')
  @Auth(Permission.EVENT_READ)
  @ApiOperation({ summary: 'Update an event (organiser or hosting company administrator)' })
  update(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.eventsService.update(id, dto, user);
  }

  @Delete(':id')
  @Auth(Permission.EVENT_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event (organiser or hosting company administrator)' })
  async remove(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.eventsService.remove(id, user);
  }

  @Post(':id/registrations')
  @Auth(Permission.EVENT_REGISTER)
  @ApiOperation({ summary: 'Register yourself for an event' })
  register(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.eventsService.register(id, user);
  }

  @Delete(':id/registrations/me')
  @Auth(Permission.EVENT_REGISTER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel your own registration' })
  async unregister(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.eventsService.unregister(id, user);
  }

  @Get(':id/registrations/me')
  @Auth(Permission.EVENT_REGISTER)
  @ApiOperation({ summary: 'Your own registration for an event' })
  getOwnRegistration(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.eventsService.getOwnRegistration(id, user);
  }

  @Get(':id/registrations')
  @Auth(Permission.EVENT_READ)
  @ApiOperation({ summary: 'Attendee list (organiser or hosting company administrator only)' })
  async listRegistrations(
    @Param('id', ParseUuidPipe) id: UUID,
    @CurrentUser() user: AuthContext,
    @Query() query: PaginationQueryDto,
  ) {
    const pagination = parsePagination(query);
    const { data, total } = await this.eventsService.listRegistrations(id, user, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }
}
