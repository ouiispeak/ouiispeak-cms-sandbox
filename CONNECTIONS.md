# CONNECTIONS

Last audited: 2026-04-09

This inventory documents external services referenced by this CMS repo, including active runtime integrations and disabled/config-only integrations.

## 1) Full connection inventory

| Service | Status | Purpose in this system | Env vars | Owner | Code touchpoints |
| --- | --- | --- | --- | --- | --- |
| Supabase (PostgREST + RPC + Postgres) | Active | Primary backend and runtime source of truth for hierarchy/config data; powers CRUD, import/export, and config field authority. | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | TODO assign explicit owner (`CODEOWNERS` not present). Suggested: CMS Platform/Data. | `lib/componentCore.ts`, `lib/universalConfigs.ts`, `lib/levels.ts`, `lib/hierarchyComponentEngine.ts`, `lib/modules.ts`, `lib/lessons.ts`, `lib/groups.ts`, `lib/slides.ts`, `lib/activitySlides.ts`, `lib/titleSlides.ts`, `lib/lessonEnds.ts`, `lib/nestedLessons.ts`, `app/page.tsx`, `app/levels/page.tsx`, `app/configs/[[...scope]]/page.tsx`, `app/edit-*/[id]/page.tsx` routes, `app/api/**/import-json/route.ts`, `app/api/**/export-json/route.ts`, `supabase/manual/*.sql`, `supabase/config.toml`, `.env.example`, `.env.local`, `tests/import-atomicity.test.ts` |
| Lesson Player (separate web app, link-out only) | Active | Opens a lesson in the player UI from CMS lesson edit page (`/lab/lesson/:lessonId`). | `LESSON_PLAYER_BASE_URL` (server), `NEXT_PUBLIC_LESSON_PLAYER_BASE_URL` (fallback), hardcoded fallback `http://localhost:3001` | TODO assign explicit owner. Suggested: Lesson Player team. | `app/edit-lesson/[lessonId]/page.tsx` |
| OpenAI (via Supabase Studio AI helper) | Configured in local Supabase config; not used by CMS runtime code | Optional key passed to Supabase Studio AI helper in local stack. | `OPENAI_API_KEY` | TODO assign explicit owner. Suggested: DevOps/Platform (Supabase local stack maintainer). | `supabase/config.toml` (`[studio].openai_api_key`) |
| Twilio (Supabase Auth SMS provider) | Disabled/config-only | Optional SMS auth provider in Supabase local config template. | `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` | TODO assign explicit owner if enabled. | `supabase/config.toml` (`[auth.sms.twilio] enabled = false`) |
| Apple OAuth (Supabase external auth provider) | Disabled/config-only | Optional external OAuth provider in Supabase local config template. | `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET` | TODO assign explicit owner if enabled. | `supabase/config.toml` (`[auth.external.apple] enabled = false`) |
| AWS S3 (Supabase experimental OrioleDB/S3 settings) | Config-only; feature not enabled here | Optional experimental storage backend settings in Supabase config. | `S3_HOST`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | TODO assign explicit owner if enabled. | `supabase/config.toml` (`[experimental]` section) |
| Whisper | Not detected in this repo | No code or config references found in audited scope. | None in repo | N/A | No touchpoints found (`rg` scan on `whisper`/related API usage) |
| ElevenLabs | Not detected in this repo | No code or config references found in audited scope. | None in repo | N/A | No touchpoints found (`rg` scan on `elevenlabs`/related API usage) |

## 2) Notes and ownership gap

- No `CODEOWNERS` file exists in this repo, so service ownership is not codified.
- To close the ownership gap, add a `CODEOWNERS` file (or an explicit owner map) and replace `TODO assign explicit owner` values above.
- If Whisper or ElevenLabs are added later, this file should be updated in the same change that introduces their env vars/code paths.

## 3) Audit method (for reproducibility)

- Searched for env access and external calls: `process.env`, `fetch(`, service names, and URL patterns.
- Audited runtime folders: `app`, `lib`, `components`, `scripts`, `tests`.
- Audited config/docs for declared integrations: `.env.example`, `.env.local`, `supabase/config.toml`, `README.md`, `docs/*`.
