-- Profile experience entries (BQ-85, POST/PATCH/DELETE /me/experience), and connections
-- dropped from the MVP (2026-11-10): the v1 routes stay deprecated and change nothing.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- Nothing has launched and no code reads the table any more, so it is dropped in the same
-- release (no expand/contract window needed). Its foreign keys go with it.
-- squawk-ignore ban-drop-table
DROP TABLE "app"."professional_connections";

-- CreateTable
CREATE TABLE "app"."profile_experiences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_profile_experiences__user_start" ON "app"."profile_experiences"("user_id", "start_date" DESC);

-- AddForeignKey
ALTER TABLE "app"."profile_experiences" ADD CONSTRAINT "fk_profile_experiences__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- Rules the schema cannot express in Prisma.
ALTER TABLE "app"."profile_experiences"
  ADD CONSTRAINT ck_profile_experiences__role_not_blank CHECK (btrim(role) <> ''),
  ADD CONSTRAINT ck_profile_experiences__company_not_blank CHECK (btrim(company) <> ''),
  ADD CONSTRAINT ck_profile_experiences__end_not_before_start CHECK (end_date IS NULL OR end_date >= start_date);

-- Deny by default to Supabase client roles (supabase-architecture.md §3).
SELECT app.enable_rls('app.profile_experiences');
