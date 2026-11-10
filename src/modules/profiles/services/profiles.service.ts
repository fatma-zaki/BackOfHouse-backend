import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember } from '../../../common/context/actor';
import { NotFoundError, ValidationFailedError } from '../../../common/errors';
import { Locale, pickText } from '../../../common/i18n/locale';
import { riyadhDay } from '../../../common/time/riyadh';
import { parseInput } from '../../../common/validation/parse-input';
import type { Profile, ProfileExperience, ProfileProject } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditActorType, AuditLogger } from '../../audit';
import { MembersService } from '../../identity';
import { TaxonomyService } from '../../taxonomy';
import { compareExperience, currentCompany, yearsOfExperience } from '../domain/experience';

const INTERESTS = ['TECH_INNOVATION', 'MARKETING', 'DESIGN', 'BUSINESS', 'NETWORKING', 'PRODUCTION'] as const;

const updateSchema = z
  .object({
    name: z.string().trim().min(2, 'must be at least 2 characters').max(120),
    headline: z.string().trim().max(120, 'must be at most 120 characters'),
    city: z.string().trim().max(100, 'must be at most 100 characters'),
    about: z.string().trim().max(600, 'must be at most 600 characters'),
    profile_status: z.enum(['PROFESSIONAL', 'STUDENT']),
    interests: z
      .array(z.enum(INTERESTS))
      .max(INTERESTS.length)
      .refine((items) => new Set(items).size === items.length, 'must not repeat an interest'),
    contact_privacy: z
      .object({ share_email: z.boolean().default(false), share_phone: z.boolean().default(false) })
      .strict(),
  })
  .strict();

const MAX_PROJECTS = 50;
const MAX_EXPERIENCE = 30;
const MAX_SKILLS = 30;
const FIRST_YEAR = 1950;

const text = (max: number) => z.string().trim().min(1, 'is required').max(max, `must be at most ${max} characters`);

const skillsSchema = z
  .object({
    skill_ids: z
      .array(z.string().max(64))
      .max(MAX_SKILLS, `must have at most ${MAX_SKILLS} skills`)
      .refine((ids) => new Set(ids).size === ids.length, 'must not repeat a skill'),
  })
  .strict();

const isoDate = (value: Date) => value.toISOString().slice(0, 10);

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2024-03-01')
  .refine((value) => isoDate(new Date(`${value}T00:00:00Z`)) === value, 'must be a real date');

/** An experience entry (contracts/app `Experience`). */
export interface ExperienceView {
  id: string;
  role: string;
  company: string;
  start: string;
  end: string | null;
}

/** A project on the profile (contracts/app `ProfileProject`). */
export interface ProfileProjectView {
  id: string;
  year: number;
  category: string;
  title: string;
  role: string;
}

/** An individual's own profile (contracts/app `Profile`). */
export interface ProfileView {
  name: string;
  headline: string;
  company: string | null;
  city: string;
  industry: string | null;
  about: string;
  profileStatus: 'PROFESSIONAL' | 'STUDENT';
  /** Verification arrives with Phase 3b/4. */
  verified: boolean;
  verificationLevel: number;
  availabilityNote: string | null;
  interests: string[];
  contactPrivacy: { shareEmail: boolean; sharePhone: boolean };
  /** Current roles first, then newest start first. */
  experience: ExperienceView[];
  /** Whole years covered by the experience entries, overlaps counted once. */
  yearsExperience: number;
  /** Newest year first. */
  projects: ProfileProjectView[];
  /** Skill names in the request language, in the member's order. */
  skills: string[];
}

/**
 * Profiles (contracts/app /me/profile, /me/experience, /me/projects, /me/skills). Name and
 * profile status are identity's; the rest is here. Skills come from the taxonomy
 * (`crafts`). `company` on the profile is the current role's company.
 */
@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly members: MembersService,
    private readonly audit: AuditLogger,
    private readonly taxonomy: TaxonomyService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async get(actor: Actor | undefined, locale: Locale): Promise<ProfileView> {
    const { userId } = requireMember(actor);
    return this.view(userId, locale);
  }

  /** Changing `profile_status` applies to every later eligibility check (BQ-79). */
  async update(actor: Actor | undefined, input: unknown, locale: Locale): Promise<ProfileView> {
    const { userId } = requireMember(actor);
    const data = parseInput(updateSchema, input);
    await this.transactions.run(async (tx) => {
      const { previousProfileStatus } = await this.members.updateIndividual(tx, userId, {
        fullName: data.name,
        profileStatus: data.profile_status,
      });
      const fields = {
        headline: data.headline,
        city: data.city,
        about: data.about,
        interests: data.interests,
        shareEmail: data.contact_privacy.share_email,
        sharePhone: data.contact_privacy.share_phone,
      };
      await tx.profile.upsert({ where: { userId }, create: { userId, ...fields }, update: fields });
      await this.audit.record({
        actor: { type: AuditActorType.USER, userId },
        action: 'user.profile.update',
        entityType: 'user',
        entityId: userId,
        changes: {
          before: { profile_status: previousProfileStatus },
          after: {
            profile_status: data.profile_status,
            share_email: fields.shareEmail,
            share_phone: fields.sharePhone,
          },
        },
      });
    });
    return this.view(userId, locale);
  }

  /** Adds an experience entry; at most 30 per profile. */
  async createExperience(actor: Actor | undefined, input: unknown): Promise<ExperienceView> {
    const { userId } = requireMember(actor);
    const data = parseInput(this.experienceSchema(), input);
    const entry = await this.transactions.run(async (tx) => {
      if ((await tx.profileExperience.count({ where: { userId } })) >= MAX_EXPERIENCE) {
        throw new ValidationFailedError({ '(body)': [`A profile holds at most ${MAX_EXPERIENCE} experience entries`] });
      }
      const created = await tx.profileExperience.create({ data: { userId, ...data } });
      await this.recordEntry(userId, 'user.profile.experience.create', 'profile_experience', created.id);
      return created;
    });
    return experienceView(entry);
  }

  /** The whole entry is sent. Another member's entry is not found (404). */
  async updateExperience(actor: Actor | undefined, entryId: string, input: unknown): Promise<ExperienceView> {
    const { userId } = requireMember(actor);
    await this.requireOwn('experience', userId, entryId);
    const data = parseInput(this.experienceSchema(), input);
    const entry = await this.transactions.run(async (tx) => {
      const updated = await tx.profileExperience.update({ where: { id: entryId }, data });
      await this.recordEntry(userId, 'user.profile.experience.update', 'profile_experience', entryId);
      return updated;
    });
    return experienceView(entry);
  }

  async deleteExperience(actor: Actor | undefined, entryId: string): Promise<void> {
    const { userId } = requireMember(actor);
    await this.requireOwn('experience', userId, entryId);
    await this.transactions.run(async (tx) => {
      await tx.profileExperience.delete({ where: { id: entryId } });
      await this.recordEntry(userId, 'user.profile.experience.delete', 'profile_experience', entryId);
    });
  }

  /** Adds a project; at most 50 per profile. */
  async createProject(actor: Actor | undefined, input: unknown): Promise<ProfileProjectView> {
    const { userId } = requireMember(actor);
    const data = parseInput(this.projectSchema(), input);
    const project = await this.transactions.run(async (tx) => {
      if ((await tx.profileProject.count({ where: { userId } })) >= MAX_PROJECTS) {
        throw new ValidationFailedError({ '(body)': [`A profile holds at most ${MAX_PROJECTS} projects`] });
      }
      const created = await tx.profileProject.create({ data: { userId, ...data } });
      await this.recordEntry(userId, 'user.profile.project.create', 'profile_project', created.id);
      return created;
    });
    return projectView(project);
  }

  /** The whole project is sent. Another member's project is not found (404). */
  async updateProject(actor: Actor | undefined, projectId: string, input: unknown): Promise<ProfileProjectView> {
    const { userId } = requireMember(actor);
    await this.requireOwn('project', userId, projectId);
    const data = parseInput(this.projectSchema(), input);
    const project = await this.transactions.run(async (tx) => {
      const updated = await tx.profileProject.update({ where: { id: projectId }, data });
      await this.recordEntry(userId, 'user.profile.project.update', 'profile_project', projectId);
      return updated;
    });
    return projectView(project);
  }

  async deleteProject(actor: Actor | undefined, projectId: string): Promise<void> {
    const { userId } = requireMember(actor);
    await this.requireOwn('project', userId, projectId);
    await this.transactions.run(async (tx) => {
      await tx.profileProject.delete({ where: { id: projectId } });
      await this.recordEntry(userId, 'user.profile.project.delete', 'profile_project', projectId);
    });
  }

  /**
   * Replaces the skills with `skill_ids` (taxonomy `crafts`, active ones only), in that
   * order. An empty list clears them.
   */
  async setSkills(actor: Actor | undefined, input: unknown, locale: Locale): Promise<ProfileView> {
    const { userId } = requireMember(actor);
    const { skill_ids: ids } = parseInput(skillsSchema, input);
    const offered = new Set((await this.taxonomy.skillsByIds(ids)).filter((s) => s.active).map((s) => s.id));
    const unknown = ids.filter((id) => !offered.has(id));
    if (unknown.length > 0) {
      throw new ValidationFailedError({ skill_ids: [`unknown or retired skill id(s): ${unknown.join(', ')}`] });
    }
    await this.transactions.run(async (tx) => {
      await tx.profileSkill.deleteMany({ where: { userId } });
      await tx.profileSkill.createMany({ data: ids.map((skillId, sortOrder) => ({ userId, skillId, sortOrder })) });
    });
    return this.view(userId, locale);
  }

  /** For `AppUser.headline` (GET /me); null until the member writes one. */
  async headlineOf(userId: string): Promise<string | null> {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { headline: true } });
    return profile?.headline || null;
  }

  /** The year may be at most next year (Riyadh time). */
  private projectSchema() {
    const latest = Number(riyadhDay(this.clock.now()).slice(0, 4)) + 1;
    return z
      .object({
        year: z
          .number()
          .int('must be a whole year')
          .min(FIRST_YEAR, `must be ${FIRST_YEAR} or later`)
          .max(latest, `must be ${latest} or earlier`),
        category: text(100),
        title: text(200),
        role: text(200),
      })
      .strict();
  }

  /** Start and end are not in the future (Riyadh time); the end is not before the start. */
  private experienceSchema() {
    const today = riyadhDay(this.clock.now());
    const notFuture = date.refine((value) => value <= today, 'must not be in the future');
    return z
      .object({
        role: text(120),
        company: text(200),
        start: notFuture,
        end: notFuture.nullable().optional(),
      })
      .strict()
      .refine((e) => !e.end || e.end >= e.start, { path: ['end'], message: 'must not be before start' })
      .transform((e) => ({
        role: e.role,
        company: e.company,
        startDate: new Date(`${e.start}T00:00:00Z`),
        endDate: e.end ? new Date(`${e.end}T00:00:00Z`) : null,
      }));
  }

  private async recordEntry(userId: string, action: string, entityType: string, entityId: string): Promise<void> {
    await this.audit.record({ actor: { type: AuditActorType.USER, userId }, action, entityType, entityId });
  }

  /** Another member's entry answers 404, never 403, so ids do not leak. */
  private async requireOwn(kind: 'experience' | 'project', userId: string, id: string): Promise<void> {
    const valid = z.string().uuid().safeParse(id).success;
    const count = !valid
      ? 0
      : kind === 'experience'
        ? await this.prisma.profileExperience.count({ where: { id, userId } })
        : await this.prisma.profileProject.count({ where: { id, userId } });
    if (count === 0)
      throw new NotFoundError(kind === 'experience' ? 'Experience entry not found' : 'Project not found');
  }

  private async view(userId: string, locale: Locale): Promise<ProfileView> {
    const [member, profile, experienceRows, projects, skillRows] = await Promise.all([
      this.members.view(userId),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.profileExperience.findMany({ where: { userId } }),
      this.prisma.profileProject.findMany({ where: { userId }, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.profileSkill.findMany({ where: { userId }, orderBy: { sortOrder: 'asc' } }),
    ]);
    const experience = experienceRows.map(experienceView);
    const skills = new Map(
      (await this.taxonomy.skillsByIds(skillRows.map((r) => r.skillId))).map((s) => [s.id, pickText(s.name, locale)]),
    );
    const p: Partial<Profile> = profile ?? {};
    return {
      name: member.fullName,
      headline: p.headline ?? '',
      company: p.currentCompany ?? currentCompany(experience),
      city: p.city ?? '',
      industry: p.industry ?? null,
      about: p.about ?? '',
      profileStatus: member.profileStatus ?? 'PROFESSIONAL',
      verified: false,
      verificationLevel: 0,
      availabilityNote: p.availabilityNote ?? null,
      interests: p.interests ?? [],
      contactPrivacy: { shareEmail: p.shareEmail ?? false, sharePhone: p.sharePhone ?? false },
      experience: [...experience].sort(compareExperience),
      yearsExperience: yearsOfExperience(experience, riyadhDay(this.clock.now())),
      projects: projects.map(projectView),
      skills: skillRows.map((r) => skills.get(r.skillId)).filter((name): name is string => name !== undefined),
    };
  }
}

function experienceView(entry: ProfileExperience): ExperienceView {
  return {
    id: entry.id,
    role: entry.role,
    company: entry.company,
    start: isoDate(entry.startDate),
    end: entry.endDate ? isoDate(entry.endDate) : null,
  };
}

function projectView(project: ProfileProject): ProfileProjectView {
  return {
    id: project.id,
    year: project.year,
    category: project.category,
    title: project.title,
    role: project.role,
  };
}
