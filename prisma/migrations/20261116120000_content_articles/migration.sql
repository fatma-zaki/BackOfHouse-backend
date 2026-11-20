-- Phase 7 (content lane): editorial articles in English and Arabic, with members' likes,
-- saves and comments. New tables only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."article_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "app"."article_link_type" AS ENUM ('OPPORTUNITY', 'EVENT', 'COMPANY');

-- CreateTable
CREATE TABLE "app"."articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "topic" TEXT,
    "cover_alt_en" TEXT,
    "cover_alt_ar" TEXT,
    "headline_en" TEXT,
    "excerpt_en" TEXT,
    "body_en" TEXT,
    "cta_label_en" TEXT,
    "headline_ar" TEXT,
    "excerpt_ar" TEXT,
    "body_ar" TEXT,
    "cta_label_ar" TEXT,
    "link_type" "app"."article_link_type",
    "link_id" UUID,
    "status" "app"."article_status" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "featured_until" TIMESTAMPTZ(6),
    "feature_on_home_days" INTEGER,
    "notify_push" BOOLEAN NOT NULL DEFAULT false,
    "push_audience" JSONB,
    "share_to_company_followers" BOOLEAN NOT NULL DEFAULT false,
    "author_staff_id" UUID NOT NULL,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."article_likes" (
    "article_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_likes_pkey" PRIMARY KEY ("article_id","user_id")
);

-- CreateTable
CREATE TABLE "app"."article_saves" (
    "article_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_saves_pkey" PRIMARY KEY ("article_id","user_id")
);

-- CreateTable
CREATE TABLE "app"."article_comments" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_headline" TEXT,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_articles__status_published_at" ON "app"."articles"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "ix_articles__status_scheduled_at" ON "app"."articles"("status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_articles__slug" ON "app"."articles"("slug");

-- CreateIndex
CREATE INDEX "ix_article_likes__user_id" ON "app"."article_likes"("user_id");

-- CreateIndex
CREATE INDEX "ix_article_saves__user_created_at" ON "app"."article_saves"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ix_article_comments__article_created_at" ON "app"."article_comments"("article_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ix_article_comments__author_user_id" ON "app"."article_comments"("author_user_id");

-- AddForeignKey
ALTER TABLE "app"."articles" ADD CONSTRAINT "fk_articles__author_staff_id" FOREIGN KEY ("author_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."article_likes" ADD CONSTRAINT "fk_article_likes__article_id" FOREIGN KEY ("article_id") REFERENCES "app"."articles"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."article_likes" ADD CONSTRAINT "fk_article_likes__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."article_saves" ADD CONSTRAINT "fk_article_saves__article_id" FOREIGN KEY ("article_id") REFERENCES "app"."articles"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."article_saves" ADD CONSTRAINT "fk_article_saves__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."article_comments" ADD CONSTRAINT "fk_article_comments__article_id" FOREIGN KEY ("article_id") REFERENCES "app"."articles"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."article_comments" ADD CONSTRAINT "fk_article_comments__author_user_id" FOREIGN KEY ("author_user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- Rules the schema cannot express in Prisma.
ALTER TABLE "app"."articles"
  ADD CONSTRAINT ck_articles__slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT ck_articles__headline_length
    CHECK (char_length(headline_en) <= 90 AND char_length(headline_ar) <= 90),
  ADD CONSTRAINT ck_articles__excerpt_length
    CHECK (char_length(excerpt_en) <= 200 AND char_length(excerpt_ar) <= 200),
  ADD CONSTRAINT ck_articles__link_together CHECK ((link_type IS NULL) = (link_id IS NULL)),
  ADD CONSTRAINT ck_articles__scheduled_has_time CHECK (status <> 'SCHEDULED' OR scheduled_at IS NOT NULL),
  ADD CONSTRAINT ck_articles__published_has_time CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL),
  ADD CONSTRAINT ck_articles__feature_days CHECK (feature_on_home_days BETWEEN 0 AND 14),
  ADD CONSTRAINT ck_articles__reads_not_negative CHECK (reads >= 0);

ALTER TABLE "app"."article_comments"
  ADD CONSTRAINT ck_article_comments__text_length CHECK (char_length(btrim(text)) BETWEEN 1 AND 500);

SELECT app.enable_rls('app.articles');
SELECT app.enable_rls('app.article_likes');
SELECT app.enable_rls('app.article_saves');
SELECT app.enable_rls('app.article_comments');
