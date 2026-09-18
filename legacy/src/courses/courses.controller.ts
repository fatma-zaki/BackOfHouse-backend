import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Auth(Permission.COURSE_MANAGE)
  @ApiOperation({ summary: 'Create a course (platform administrators only)' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthContext) {
    return this.coursesService.create(dto, user);
  }

  @Get()
  @Auth(Permission.COURSE_READ)
  @ApiOperation({ summary: 'List published courses' })
  async findAll(@Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.coursesService.findAll(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get('enrollments')
  @Auth(Permission.COURSE_ENROLL)
  @ApiOperation({ summary: 'Own enrolments' })
  async listOwnEnrollments(@CurrentUser() user: AuthContext, @Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.coursesService.listOwnEnrollments(user, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get(':id')
  @Auth(Permission.COURSE_READ)
  @ApiOperation({ summary: 'Get a course by id' })
  findById(@Param('id', ParseUuidPipe) id: UUID) {
    return this.coursesService.findById(id);
  }

  @Patch(':id')
  @Auth(Permission.COURSE_MANAGE)
  @ApiOperation({ summary: 'Update a course (platform administrators only)' })
  update(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.coursesService.update(id, dto, user);
  }

  @Delete(':id')
  @Auth(Permission.COURSE_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course (platform administrators only)' })
  async remove(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.coursesService.remove(id, user);
  }

  @Post(':id/enroll')
  @Auth(Permission.COURSE_ENROLL)
  @ApiOperation({ summary: 'Enrol in a published course' })
  enroll(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.coursesService.enroll(id, user);
  }

  @Post(':id/complete')
  @Auth(Permission.COURSE_ENROLL)
  @ApiOperation({ summary: 'Mark own enrolment complete; course points are credited once' })
  complete(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.coursesService.complete(id, user);
  }
}
