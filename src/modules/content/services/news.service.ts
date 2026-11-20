import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor } from '../../../common/context/actor';
import { ErrorCode, ForbiddenError, NotFoundError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { isUuid } from '../../../common/ids/uuid-v7';
import { parseInput } from '../../../common/validation/parse-input';
import type { Prisma } from '../../../generated/prisma/client';
import type { ProfileInterest } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../platform/database';
import { MembersService } from '../../identity';
import { ProfilesService } from '../../profiles';
import { TaxonomyService } from '../../taxonomy';
import { ArticleBlock, articleBlocks, articlePlainText, readMinutes, teaserOf } from '../domain/article-html';
import { labelsOf, NEWS_TOPICS } from './articles.service';

/** Articles come from the Back of House editorial desk (docs/app/README.md "News"). */
export const NEWS_SOURCE = { en: 'Back of House', ar: 'باك أوف هاوس' } as const;
const RELATED_LIMIT = 5;

const listSchema = z.object({
  order: z.enum(['FOR_YOU', 'LATEST']).default('FOR_YOU'),
  topic: z.enum(NEWS_TOPICS).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
});

const commentSchema = z
  .object({ text: z.string().trim().min(1, 'must not be empty').max(500, 'must be at most 500 characters') })
  .strict();

const commentsPageSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
});

/** contracts/app `Article`, in the request language. `body` only on the detail. */
export interface NewsArticleView {
  id: string;
  topic: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  teaser: string;
  readMinutes: number;
  publishedAt: Date;
  imageCaption: string | null;
  breaking: boolean;
  labels: string[];
  body?: ArticleBlock[];
  likeCount: number;
  liked: boolean;
  commentCount: number;
  saved: boolean;
}

/** contracts/app `ArticleComment`. */
export interface ArticleCommentView {
  id: string;
  articleId: string;
  authorName: string;
  authorHeadline: string | null;
  text: string;
  createdAt: Date;
  mine: boolean;
}

type Viewer = { userId: string; kind: 'member' | 'company' };

const counted = {
  _count: { select: { likes: true, comments: true } },
} as const;
type NewsRow = Prisma.ArticleGetPayload<{ include: typeof counted }>;

/**
 * News in the app (contracts/app /news*, docs/app/README.md "News"). Everyone signed in
 * reads published articles and comments, and may save. Only individuals like and comment;
 * a Company Account gets 403 `ENGAGEMENT_NOT_ALLOWED`, as does deleting another person's
 * comment. Unpublished articles answer 404 everywhere.
 */
@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly members: MembersService,
    private readonly profiles: ProfilesService,
    private readonly taxonomy: TaxonomyService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * LATEST is newest first. FOR_YOU leads with what the desk features on Home ("breaking"),
   * then articles tagged with one of the member's interests (BQ-91c), then the rest; each
   * group newest first. Company Accounts have no interests, so they get featured, then the rest.
   */
  async list(
    actor: Actor | undefined,
    input: unknown,
    locale: Locale,
  ): Promise<{ items: NewsArticleView[]; hasMore: boolean }> {
    const viewer = this.viewer(actor);
    const query = parseInput(listSchema, input);
    const now = this.clock.now();
    const and: Prisma.ArticleWhereInput[] = [{ status: 'PUBLISHED' }];
    if (query.topic) and.push({ topic: query.topic });
    if (query.q) {
      const like = { contains: query.q, mode: 'insensitive' as const };
      and.push({ OR: [{ headlineEn: like }, { headlineAr: like }, { excerptEn: like }, { excerptAr: like }] });
    }
    const where: Prisma.ArticleWhereInput = { AND: and };
    const skip = (query.page - 1) * query.page_size;
    const take = query.page_size + 1;
    let rows: NewsRow[];
    if (query.order === 'LATEST') {
      rows = await this.prisma.article.findMany({
        where,
        include: counted,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      });
    } else {
      const featured: Prisma.ArticleWhereInput = { featuredUntil: { gt: now } };
      const notFeatured: Prisma.ArticleWhereInput = { OR: [{ featuredUntil: null }, { featuredUntil: { lte: now } }] };
      const interests = (
        viewer.kind === 'member' ? await this.profiles.interestsOf(viewer.userId) : []
      ) as ProfileInterest[];
      const shared: Prisma.ArticleWhereInput = { interests: { hasSome: interests } };
      const groups =
        interests.length > 0
          ? [[featured], [notFeatured, shared], [notFeatured, { NOT: shared }]]
          : [[featured], [notFeatured]];
      rows = await this.grouped(
        groups.map((extra) => ({ AND: [...and, ...extra] })),
        skip,
        take,
      );
    }
    const hasMore = rows.length > query.page_size;
    const items = await this.views(rows.slice(0, query.page_size), viewer, locale, false);
    return { items, hasMore };
  }

  /** One page across groups listed in order, each newest first. */
  private async grouped(groups: Prisma.ArticleWhereInput[], skip: number, take: number): Promise<NewsRow[]> {
    const rows: NewsRow[] = [];
    let offset = skip;
    for (const where of groups) {
      if (rows.length >= take) break;
      const count = await this.prisma.article.count({ where });
      if (offset >= count) {
        offset -= count;
        continue;
      }
      rows.push(
        ...(await this.prisma.article.findMany({
          where,
          include: counted,
          orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
          skip: offset,
          take: take - rows.length,
        })),
      );
      offset = 0;
    }
    return rows;
  }

  /** One live article with its body; each open counts a read. */
  async get(actor: Actor | undefined, articleId: string, locale: Locale): Promise<NewsArticleView> {
    const viewer = this.viewer(actor);
    await this.requireLive(articleId);
    // Raw SQL so a read does not move updated_at (the editors' "recently edited" order).
    await this.prisma.$executeRaw`UPDATE app.articles SET reads = reads + 1 WHERE id = ${articleId}::uuid`;
    return this.one(articleId, viewer, locale);
  }

  /** Up to five other live articles: the same topic first, then the newest. */
  async related(actor: Actor | undefined, articleId: string, locale: Locale): Promise<NewsArticleView[]> {
    const viewer = this.viewer(actor);
    const article = await this.requireLive(articleId);
    const others = { status: 'PUBLISHED' as const, id: { not: articleId } };
    const sameTopic = article.topic
      ? await this.prisma.article.findMany({
          where: { ...others, topic: article.topic },
          include: counted,
          orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
          take: RELATED_LIMIT,
        })
      : [];
    const rest =
      sameTopic.length < RELATED_LIMIT
        ? await this.prisma.article.findMany({
            where: { ...others, id: { notIn: [articleId, ...sameTopic.map((r) => r.id)] } },
            include: counted,
            orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
            take: RELATED_LIMIT - sameTopic.length,
          })
        : [];
    return this.views([...sameTopic, ...rest], viewer, locale, false);
  }

  async save(actor: Actor | undefined, articleId: string, locale: Locale): Promise<NewsArticleView> {
    const viewer = this.viewer(actor);
    await this.requireLive(articleId);
    await this.prisma.articleSave.createMany({ data: [{ articleId, userId: viewer.userId }], skipDuplicates: true });
    return this.one(articleId, viewer, locale);
  }

  async unsave(actor: Actor | undefined, articleId: string, locale: Locale): Promise<NewsArticleView> {
    const viewer = this.viewer(actor);
    await this.requireLive(articleId);
    await this.prisma.articleSave.deleteMany({ where: { articleId, userId: viewer.userId } });
    return this.one(articleId, viewer, locale);
  }

  async like(actor: Actor | undefined, articleId: string, locale: Locale): Promise<NewsArticleView> {
    const viewer = this.engager(actor);
    await this.requireLive(articleId);
    await this.prisma.articleLike.createMany({ data: [{ articleId, userId: viewer.userId }], skipDuplicates: true });
    return this.one(articleId, viewer, locale);
  }

  async unlike(actor: Actor | undefined, articleId: string, locale: Locale): Promise<NewsArticleView> {
    const viewer = this.engager(actor);
    await this.requireLive(articleId);
    await this.prisma.articleLike.deleteMany({ where: { articleId, userId: viewer.userId } });
    return this.one(articleId, viewer, locale);
  }

  /** Newest first; everyone signed in may read. */
  async comments(
    actor: Actor | undefined,
    articleId: string,
    input: unknown,
  ): Promise<{ items: ArticleCommentView[]; hasMore: boolean }> {
    const viewer = this.viewer(actor);
    const query = parseInput(commentsPageSchema, input);
    await this.requireLive(articleId);
    const rows = await this.prisma.articleComment.findMany({
      where: { articleId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.page_size,
      take: query.page_size + 1,
    });
    return {
      items: rows.slice(0, query.page_size).map((row) => commentView(row, viewer.userId)),
      hasMore: rows.length > query.page_size,
    };
  }

  /** A flat comment by an individual, with their name and headline as they are now. */
  async comment(actor: Actor | undefined, articleId: string, input: unknown): Promise<ArticleCommentView> {
    const viewer = this.engager(actor);
    const data = parseInput(commentSchema, input);
    await this.requireLive(articleId);
    const [member, headline] = await Promise.all([
      this.members.contact(viewer.userId),
      this.profiles.headlineOf(viewer.userId),
    ]);
    if (!member) throw new NotFoundError('Member not found');
    const row = await this.prisma.articleComment.create({
      data: {
        articleId,
        authorUserId: viewer.userId,
        authorName: member.fullName,
        authorHeadline: headline,
        text: data.text,
      },
    });
    return commentView(row, viewer.userId);
  }

  /** Only the author deletes a comment. */
  async deleteComment(actor: Actor | undefined, articleId: string, commentId: string): Promise<void> {
    const viewer = this.viewer(actor);
    await this.requireLive(articleId);
    const row = isUuid(commentId)
      ? await this.prisma.articleComment.findFirst({ where: { id: commentId, articleId } })
      : null;
    if (!row) throw new NotFoundError('Comment not found');
    if (row.authorUserId !== viewer.userId) {
      throw new ForbiddenError('Only the author may delete a comment', ErrorCode.ENGAGEMENT_NOT_ALLOWED);
    }
    await this.prisma.articleComment.delete({ where: { id: commentId } });
  }

  private async one(articleId: string, viewer: Viewer, locale: Locale): Promise<NewsArticleView> {
    const row = await this.prisma.article.findUniqueOrThrow({ where: { id: articleId }, include: counted });
    const [item] = await this.views([row], viewer, locale, true);
    return item;
  }

  private async views(rows: NewsRow[], viewer: Viewer, locale: Locale, withBody: boolean) {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [labels, likes, saves] = await Promise.all([
      this.taxonomy.newsTopicLabels(locale),
      this.prisma.articleLike.findMany({
        where: { userId: viewer.userId, articleId: { in: ids } },
        select: { articleId: true },
      }),
      this.prisma.articleSave.findMany({
        where: { userId: viewer.userId, articleId: { in: ids } },
        select: { articleId: true },
      }),
    ]);
    const liked = new Set(likes.map((l) => l.articleId));
    const saved = new Set(saves.map((s) => s.articleId));
    const now = this.clock.now();
    return rows.map((row): NewsArticleView => {
      const ar = locale === 'ar';
      const title = (ar ? row.headlineAr : row.headlineEn) ?? '';
      const body = (ar ? row.bodyAr : row.bodyEn) ?? '';
      const excerpt = (ar ? row.excerptAr : row.excerptEn) ?? '';
      const text = articlePlainText(body);
      const topic = row.topic ?? NEWS_TOPICS[0];
      return {
        id: row.id,
        topic,
        category: labels.get(topic) ?? topic,
        title,
        summary: excerpt || teaserOf(text, 200),
        // The desk's credit when it set one (BQ-91b), else Back of House.
        source: (ar ? row.sourceAr : row.sourceEn) || NEWS_SOURCE[locale],
        teaser: teaserOf(text),
        readMinutes: readMinutes(text),
        publishedAt: row.publishedAt!,
        imageCaption: null,
        breaking: !!row.featuredUntil && row.featuredUntil > now,
        labels: labelsOf(row.labels)
          .map((l) => (ar ? l.ar : l.en))
          .filter((l) => l !== ''),
        ...(withBody ? { body: articleBlocks(body) } : {}),
        likeCount: row._count.likes,
        liked: liked.has(row.id),
        commentCount: row._count.comments,
        saved: saved.has(row.id),
      };
    });
  }

  private async requireLive(articleId: string): Promise<{ topic: string | null }> {
    const row = isUuid(articleId)
      ? await this.prisma.article.findFirst({
          where: { id: articleId, status: 'PUBLISHED' },
          select: { topic: true },
        })
      : null;
    if (!row) throw new NotFoundError('Article not found');
    return row;
  }

  /** Any app account reads and saves. */
  private viewer(actor: Actor | undefined): Viewer {
    if (actor?.kind === 'member' || actor?.kind === 'company') return { userId: actor.userId, kind: actor.kind };
    throw new ForbiddenError('This is for app accounts');
  }

  /** Only individuals like and comment (docs/app/README.md "Who may call what"). */
  private engager(actor: Actor | undefined): Viewer {
    const viewer = this.viewer(actor);
    if (viewer.kind !== 'member') {
      throw new ForbiddenError('Companies read news but do not like or comment', ErrorCode.ENGAGEMENT_NOT_ALLOWED);
    }
    return viewer;
  }
}

function commentView(
  row: {
    id: string;
    articleId: string;
    authorUserId: string;
    authorName: string;
    authorHeadline: string | null;
    text: string;
    createdAt: Date;
  },
  viewerId: string,
): ArticleCommentView {
  return {
    id: row.id,
    articleId: row.articleId,
    authorName: row.authorName,
    authorHeadline: row.authorHeadline,
    text: row.text,
    createdAt: row.createdAt,
    mine: row.authorUserId === viewerId,
  };
}
