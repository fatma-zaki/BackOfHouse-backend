-- Phase 1B, taxonomy (database-entities.md §4; mapping decided 2026-10-29).
-- Additive only (expand step).

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."location_type" AS ENUM ('REGION', 'CITY');

-- CreateTable
CREATE TABLE "app"."locations" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "type" "app"."location_type" NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'SA',
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."skills" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."industries" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."taxonomy_labels" (
    "kind" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "taxonomy_labels_pkey" PRIMARY KEY ("kind","code")
);

-- CreateIndex
CREATE INDEX "ix_locations__type_country_code" ON "app"."locations"("type", "country_code");

-- CreateIndex
CREATE INDEX "ix_locations__parent_id" ON "app"."locations"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_locations__slug" ON "app"."locations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_skills__slug" ON "app"."skills"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_industries__slug" ON "app"."industries"("slug");

-- AddForeignKey
ALTER TABLE "app"."locations" ADD CONSTRAINT "fk_locations__parent_id" FOREIGN KEY ("parent_id") REFERENCES "app"."locations"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ---------------------------------------------------------------------------
-- Constraints Prisma's schema language cannot express (ADR-002)
-- ---------------------------------------------------------------------------
ALTER TABLE app.locations
  ADD CONSTRAINT ck_locations__slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT ck_locations__names_not_blank CHECK (btrim(name_en) <> '' AND btrim(name_ar) <> ''),
  ADD CONSTRAINT ck_locations__not_own_parent CHECK (parent_id IS NULL OR parent_id <> id),
  ADD CONSTRAINT ck_locations__region_has_no_parent CHECK (type <> 'REGION' OR parent_id IS NULL),
  ADD CONSTRAINT ck_locations__sort_order_not_negative CHECK (sort_order >= 0),
  ADD CONSTRAINT ck_locations__country_code_format CHECK (country_code ~ '^[A-Z]{2}$');

ALTER TABLE app.skills
  ADD CONSTRAINT ck_skills__slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT ck_skills__names_not_blank CHECK (btrim(name_en) <> '' AND btrim(name_ar) <> ''),
  ADD CONSTRAINT ck_skills__sort_order_not_negative CHECK (sort_order >= 0);

ALTER TABLE app.industries
  ADD CONSTRAINT ck_industries__slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT ck_industries__names_not_blank CHECK (btrim(name_en) <> '' AND btrim(name_ar) <> ''),
  ADD CONSTRAINT ck_industries__sort_order_not_negative CHECK (sort_order >= 0);

ALTER TABLE app.taxonomy_labels
  ADD CONSTRAINT ck_taxonomy_labels__kind CHECK (kind IN ('company_types', 'opportunity_types', 'news_topics')),
  ADD CONSTRAINT ck_taxonomy_labels__code_format CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
  ADD CONSTRAINT ck_taxonomy_labels__names_not_blank CHECK (btrim(name_en) <> '' AND btrim(name_ar) <> ''),
  ADD CONSTRAINT ck_taxonomy_labels__sort_order_not_negative CHECK (sort_order >= 0);

-- ---------------------------------------------------------------------------
-- RLS backstop: enabled, no policies (supabase-architecture.md §6)
-- ---------------------------------------------------------------------------
SELECT app.enable_rls('app.locations');
SELECT app.enable_rls('app.skills');
SELECT app.enable_rls('app.industries');
SELECT app.enable_rls('app.taxonomy_labels');
