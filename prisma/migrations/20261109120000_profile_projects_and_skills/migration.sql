-- Phase 3a follow-up (BQ-85): an individual's portfolio projects and skills, entered from
-- the app (POST/PATCH/DELETE /me/projects, PUT /me/skills). Additive only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateTable
CREATE TABLE "app"."profile_projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."profile_skills" (
    "user_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "profile_skills_pkey" PRIMARY KEY ("user_id","skill_id")
);

-- CreateIndex
CREATE INDEX "ix_profile_projects__user_year" ON "app"."profile_projects"("user_id", "year" DESC);

-- CreateIndex
CREATE INDEX "ix_profile_skills__skill_id" ON "app"."profile_skills"("skill_id");

-- AddForeignKey
ALTER TABLE "app"."profile_projects" ADD CONSTRAINT "fk_profile_projects__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."profile_skills" ADD CONSTRAINT "fk_profile_skills__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."profile_skills" ADD CONSTRAINT "fk_profile_skills__skill_id" FOREIGN KEY ("skill_id") REFERENCES "app"."skills"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Rules the schema cannot express in Prisma.
ALTER TABLE "app"."profile_projects"
  ADD CONSTRAINT ck_profile_projects__year_range CHECK (year BETWEEN 1950 AND 2200),
  ADD CONSTRAINT ck_profile_projects__title_not_blank CHECK (btrim(title) <> ''),
  ADD CONSTRAINT ck_profile_projects__category_not_blank CHECK (btrim(category) <> ''),
  ADD CONSTRAINT ck_profile_projects__role_not_blank CHECK (btrim(role) <> '');

ALTER TABLE "app"."profile_skills"
  ADD CONSTRAINT ck_profile_skills__sort_order_not_negative CHECK (sort_order >= 0);

-- Deny by default to Supabase client roles (supabase-architecture.md §3).
SELECT app.enable_rls('app.profile_projects');
SELECT app.enable_rls('app.profile_skills');
