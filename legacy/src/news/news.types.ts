import { ISODateString, UUID } from '../common/types';

export enum NewsStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
  Moderation = 'moderation',
}

export enum CommentStatus {
  Visible = 'visible',
  Hidden = 'hidden',
  Flagged = 'flagged',
}

export enum ReactionType {
  Like = 'like',
  Love = 'love',
  Insightful = 'insightful',
  Celebrate = 'celebrate',
}

export interface NewsArticleEntity {
  id: UUID;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  cover_image_url: string | null;
  /** The platform editor who published it, never an ordinary member. */
  author_id: UUID | null;
  status: NewsStatus;
  published_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface NewsCommentEntity {
  id: UUID;
  article_id: UUID;
  user_id: UUID;
  body: string;
  status: CommentStatus;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface NewsReactionEntity {
  id: UUID;
  article_id: UUID;
  user_id: UUID;
  type: ReactionType;
  created_at: ISODateString;
}
