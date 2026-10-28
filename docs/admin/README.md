# Back of House — backend hand-off

API contract and documentation for the backend behind the Back of House screens: the mobile app (members and companies) and the admin back-office with team roles.

## How to use this with an AI code editor

1. Put this folder in the backend repository, e.g. `docs/backend-handoff/`.
2. Open the editor in the backend repository and give it this prompt:

   > Read `docs/backend-handoff/AGENT_INSTRUCTIONS.md` and follow it. Start with Phase 0 and stop after the gap report.

3. Review the gap report it writes, answer its questions, then ask it to continue phase by phase.

## What's inside

```
AGENT_INSTRUCTIONS.md              Step-by-step build plan, rules and definition of done (start here)
openapi/openapi.yaml               OpenAPI 3.1 contract: 195 operations, 105 schemas (validated)
prisma/schema.prisma               Target data model for PostgreSQL (validated)
docs/01-domain-and-rules.md        Business rules, state machines, open questions
docs/02-roles-and-permissions.md   Permission keys and the role matrix
docs/03-data-model.md              Model groups, constraints, caches, bilingual fields
docs/04-api-conventions.md         Auth, errors, pagination, languages, idempotency, uploads, audit
docs/05-screen-api-map.md          Every HTML screen → the endpoints it calls, plus a full endpoint index
docs/06-jobs-notifications-analytics.md  Background jobs, notifications, metric definitions, export datasets
```

View the contract in any OpenAPI viewer (Swagger UI, Redocly, Stoplight) or import it into Postman.

## Before building, confirm

- Profile-completion points: +100 (admin settings) or +50 (app screens)?
- Level thresholds.
- Support working hours for the 4-hour first-reply target.

These are listed under "Open questions" in `docs/01-domain-and-rules.md`.
