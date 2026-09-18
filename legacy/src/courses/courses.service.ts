import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CourseEnrollmentEntity, CourseEntity, CourseStatus, EnrollmentStatus } from './course.types';
import { AuthContext } from '../auth/types/auth-context';
import { RpcFunctions, Tables } from '../common/constants';
import {
  BadRequestException,
  ConflictException,
  InternalOperationException,
  NotFoundException,
} from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { buildSearchFilter, resolveSort, sanitizeSearchTerm } from '../common/utils/query.util';
import { hasUpdates, pickDefined } from '../common/utils/update.util';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'instructor',
  'thumbnail_url',
  'duration_minutes',
  'points_reward',
  'status',
] as const;

const SEARCHABLE_COLUMNS = ['title', 'instructor'] as const;
const SORTABLE_COLUMNS = ['published_at', 'title', 'duration_minutes'] as const;
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCourseDto, context: AuthContext): Promise<CourseEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.COURSES)
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        instructor: dto.instructor,
        thumbnail_url: dto.thumbnail_url ?? null,
        duration_minutes: dto.duration_minutes ?? 0,
        points_reward: dto.points_reward ?? 0,
        status: CourseStatus.Draft,
      })
      .select('*')
      .single<CourseEntity>();

    if (error || !data) {
      this.logger.error(`Failed to create course: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to create the course');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.COURSE_CREATED,
      entity_type: 'course',
      entity_id: data.id,
    });

    return data;
  }

  async findAll(
    query: PaginationQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<CourseEntity>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'published_at',
      ascending: false,
    });

    let request = this.databaseService.admin
      .from(Tables.COURSES)
      .select('*', { count: 'exact' })
      .eq('status', CourseStatus.Published);

    const search = sanitizeSearchTerm(query.search);
    if (search) {
      request = request.or(buildSearchFilter(SEARCHABLE_COLUMNS, search));
    }

    const { data, error, count } = await request
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list courses: ${error.message}`);
      throw new InternalOperationException('Unable to list courses');
    }

    return { data: (data ?? []) as CourseEntity[], total: count ?? 0 };
  }

  async findById(id: UUID): Promise<CourseEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.COURSES)
      .select('*')
      .eq('id', id)
      .maybeSingle<CourseEntity>();

    if (error) {
      this.logger.error(`Failed to load course ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the course');
    }

    if (!data) {
      throw new NotFoundException('Course', id);
    }

    return data;
  }

  async update(id: UUID, dto: UpdateCourseDto, context: AuthContext): Promise<CourseEntity> {
    const course = await this.findById(id);

    const payload = pickDefined(dto, EDITABLE_FIELDS);
    if (!hasUpdates(payload)) {
      return course;
    }

    // Publishing stamps the publication date once, so republishing never
    // rewrites the original date used for ordering the catalogue.
    if (dto.status === CourseStatus.Published && !course.published_at) {
      payload['published_at'] = new Date().toISOString();
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.COURSES)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<CourseEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update course ${id}: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to update the course');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.COURSE_UPDATED,
      entity_type: 'course',
      entity_id: id,
      metadata: { fields: Object.keys(payload) },
    });

    return data;
  }

  async remove(id: UUID, context: AuthContext): Promise<void> {
    await this.findById(id);

    const { error } = await this.databaseService.admin.from(Tables.COURSES).delete().eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete course ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to delete the course');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.COURSE_DELETED,
      entity_type: 'course',
      entity_id: id,
    });
  }

  async enroll(courseId: UUID, context: AuthContext): Promise<CourseEnrollmentEntity> {
    const course = await this.findById(courseId);

    if (course.status !== CourseStatus.Published) {
      throw new BadRequestException('This course is not open for enrolment');
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.COURSE_ENROLLMENTS)
      .insert({
        course_id: courseId,
        user_id: context.profileId,
        status: EnrollmentStatus.Enrolled,
      })
      .select('*')
      .single<CourseEnrollmentEntity>();

    if (error || !data) {
      // The unique (course_id, user_id) constraint is what actually prevents a
      // double enrolment, including for two simultaneous requests.
      if (error?.code === UNIQUE_VIOLATION) {
        throw new ConflictException('You are already enrolled in this course');
      }
      this.logger.error(`Failed to enrol: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to enrol in the course');
    }

    return data;
  }

  /**
   * Marks the caller's enrolment complete and credits the course points.
   *
   * The transition and the ledger entry happen inside one transaction that only
   * applies to an enrolment still in `enrolled`, so replaying this endpoint
   * cannot mint points a second time.
   */
  async complete(courseId: UUID, context: AuthContext): Promise<CourseEnrollmentEntity> {
    const { data, error } = await this.databaseService.admin
      .rpc(RpcFunctions.COMPLETE_COURSE, {
        p_user_id: context.profileId,
        p_course_id: courseId,
      })
      .single<CourseEnrollmentEntity>();

    if (error) {
      if (error.message.includes('enrollment_not_found')) {
        throw new NotFoundException('Course enrolment');
      }
      if (error.message.includes('already_completed')) {
        throw new ConflictException('This course has already been completed');
      }
      this.logger.error(`Failed to complete course ${courseId}: ${error.message}`);
      throw new InternalOperationException('Unable to complete the course');
    }

    return data;
  }

  async listOwnEnrollments(
    context: AuthContext,
    pagination: PaginationParams,
  ): Promise<ListResult<CourseEnrollmentEntity>> {
    const { data, error, count } = await this.databaseService.admin
      .from(Tables.COURSE_ENROLLMENTS)
      .select('*', { count: 'exact' })
      .eq('user_id', context.profileId)
      .order('enrolled_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list enrolments: ${error.message}`);
      throw new InternalOperationException('Unable to list enrolments');
    }

    return { data: (data ?? []) as CourseEnrollmentEntity[], total: count ?? 0 };
  }
}
