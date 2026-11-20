-- Phase 7 content lane, BQ-91b/c: the desk's source credit, labels, and the member
-- interests an article is for (the app's FOR_YOU order). Additive only; articles is new
-- and tiny, so the short lock is fine.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- AlterTable
ALTER TABLE "app"."articles" ADD COLUMN     "interests" "app"."profile_interest"[] DEFAULT ARRAY[]::"app"."profile_interest"[],
ADD COLUMN     "labels" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "source_ar" TEXT,
ADD COLUMN     "source_en" TEXT;

-- NOT VALID: existing rows hold the defaults, which pass; new writes are checked.
ALTER TABLE "app"."articles"
  ADD CONSTRAINT ck_articles__source_length
    CHECK (char_length(source_en) <= 80 AND char_length(source_ar) <= 80) NOT VALID,
  ADD CONSTRAINT ck_articles__labels_array
    CHECK (jsonb_typeof(labels) = 'array' AND jsonb_array_length(labels) <= 5) NOT VALID;
