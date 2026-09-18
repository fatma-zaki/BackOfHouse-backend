# Legacy code (archived 2026-09-18)

This folder holds the first backend implementation, built from a standalone
"production-ready foundation" prompt. It was archived when the project owner
made `docs/` the source of truth, because it contradicts the documented design:

- Supabase JS / PostgREST data access instead of Prisma on a private `app` schema (ADR-002, ADR-007)
- reward redemption that spends points (docs: points are never deducted, BQ-08 / BQ-59)
- courses, news comments and reactions (not modelled, BQ-02)
- companies with admin/member roles (docs: one Company Account per company, ADR-030)
- job / project / supplier_request opportunity types (docs: PROJECT is not an opportunity, BQ-62)

It is excluded from the build, lint, tests and Docker image. Nothing here is
imported by `src/`. Delete the folder once it is no longer needed for reference.
