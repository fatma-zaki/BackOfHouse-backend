-- Phase 3a, profiles and the company directory: individual profiles and connections,
-- the company profile, follows, portfolio projects and profile views, and normalised
-- names (app.normalize_ar) with trigram indexes for Arabic-aware search. Additive only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."availability" AS ENUM ('AVAILABLE', 'IN_PRODUCTION', 'FULLY_BOOKED');

-- CreateEnum
CREATE TYPE "app"."professional_field" AS ENUM ('PRODUCTION', 'DESIGN', 'TECHNICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "app"."profile_interest" AS ENUM ('TECH_INNOVATION', 'MARKETING', 'DESIGN', 'BUSINESS', 'NETWORKING', 'PRODUCTION');

-- AlterTable
ALTER TABLE "app"."companies" ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "editors_pick" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followers_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "name_normalized" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specialization" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "app"."users" ADD COLUMN     "full_name_normalized" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "app"."company_follows" (
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_follows_pkey" PRIMARY KEY ("user_id","company_id")
);

-- CreateTable
CREATE TABLE "app"."company_projects" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "started_at" DATE NOT NULL,
    "ended_at" DATE,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."company_profile_views" (
    "company_id" UUID NOT NULL,
    "viewer_user_id" UUID NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "company_profile_views_pkey" PRIMARY KEY ("company_id","day","viewer_user_id")
);

-- CreateTable
CREATE TABLE "app"."profiles" (
    "user_id" UUID NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "about" TEXT NOT NULL DEFAULT '',
    "industry" TEXT,
    "current_company" TEXT,
    "availability" "app"."availability" NOT NULL DEFAULT 'AVAILABLE',
    "availability_note" TEXT,
    "professional_field" "app"."professional_field" NOT NULL DEFAULT 'OTHER',
    "interests" "app"."profile_interest"[] DEFAULT ARRAY[]::"app"."profile_interest"[],
    "share_email" BOOLEAN NOT NULL DEFAULT false,
    "share_phone" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app"."professional_connections" (
    "requester_user_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_connections_pkey" PRIMARY KEY ("requester_user_id","target_user_id")
);

-- CreateIndex
CREATE INDEX "ix_company_follows__company_id" ON "app"."company_follows"("company_id");

-- CreateIndex
CREATE INDEX "ix_company_projects__company_started_at" ON "app"."company_projects"("company_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "ix_profiles__professional_field" ON "app"."profiles"("professional_field");

-- CreateIndex
CREATE INDEX "ix_professional_connections__target_user_id" ON "app"."professional_connections"("target_user_id");

-- CreateIndex
-- users and companies exist already, but nothing has launched and both are small, so a short
-- lock is fine. CONCURRENTLY cannot run in Prisma's migration transaction.
-- squawk-ignore require-concurrent-index-creation
CREATE INDEX "ix_companies__name_normalized_trgm" ON "app"."companies" USING GIN ("name_normalized" extensions.gin_trgm_ops);

-- CreateIndex
-- users and companies exist already, but nothing has launched and both are small, so a short
-- lock is fine. CONCURRENTLY cannot run in Prisma's migration transaction.
-- squawk-ignore require-concurrent-index-creation
CREATE INDEX "ix_companies__company_type" ON "app"."companies"("company_type");

-- CreateIndex
-- users and companies exist already, but nothing has launched and both are small, so a short
-- lock is fine. CONCURRENTLY cannot run in Prisma's migration transaction.
-- squawk-ignore require-concurrent-index-creation
CREATE INDEX "ix_users__full_name_normalized_trgm" ON "app"."users" USING GIN ("full_name_normalized" extensions.gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "app"."company_follows" ADD CONSTRAINT "fk_company_follows__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."company_follows" ADD CONSTRAINT "fk_company_follows__company_id" FOREIGN KEY ("company_id") REFERENCES "app"."companies"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."company_projects" ADD CONSTRAINT "fk_company_projects__company_id" FOREIGN KEY ("company_id") REFERENCES "app"."companies"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."company_profile_views" ADD CONSTRAINT "fk_company_profile_views__company_id" FOREIGN KEY ("company_id") REFERENCES "app"."companies"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."profiles" ADD CONSTRAINT "fk_profiles__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."professional_connections" ADD CONSTRAINT "fk_professional_connections__requester_user_id" FOREIGN KEY ("requester_user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."professional_connections" ADD CONSTRAINT "fk_professional_connections__target_user_id" FOREIGN KEY ("target_user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- Existing rows get their normalised names (the app writes them from now on, with the
-- same rules in common/text/normalize-arabic.ts).
UPDATE "app"."users" SET full_name_normalized = app.normalize_ar(full_name);
UPDATE "app"."companies" SET name_normalized = app.normalize_ar(name);

-- Rules the schema cannot express in Prisma. Existing tables get NOT VALID CHECKs (no scan
-- under a write lock); they still apply to every insert and update.
ALTER TABLE "app"."companies"
  ADD CONSTRAINT ck_companies__followers_count_not_negative CHECK (followers_count >= 0) NOT VALID;

ALTER TABLE "app"."profiles"
  ADD CONSTRAINT ck_profiles__about_length CHECK (char_length(about) <= 600);

ALTER TABLE "app"."company_projects"
  ADD CONSTRAINT ck_company_projects__title_not_blank CHECK (btrim(title) <> ''),
  ADD CONSTRAINT ck_company_projects__ended_not_before_started CHECK (ended_at IS NULL OR ended_at >= started_at);

ALTER TABLE "app"."professional_connections"
  ADD CONSTRAINT ck_professional_connections__not_self CHECK (requester_user_id <> target_user_id);

-- Deny by default to Supabase client roles (supabase-architecture.md §3).
SELECT app.enable_rls('app.profiles');
SELECT app.enable_rls('app.professional_connections');
SELECT app.enable_rls('app.company_follows');
SELECT app.enable_rls('app.company_projects');
SELECT app.enable_rls('app.company_profile_views');
