# AGENTS Notes

## Scope and layout
- This repo has two codebases: Django backend at repo root (`manage.py`, `core/`, `barberia_project/`) and Expo React Native app in `barberia-app/`.
- Use `barberia-app/` as the working directory for mobile changes; root `package.json` is minimal and does not contain app scripts.

## Backend commands (Django)
- Install deps: `pip install -r requirements.txt`
- Apply DB changes before running server: `python manage.py migrate`
- Run backend: `python manage.py runserver`
- Docker dev path is configured via `docker-compose.yml` (`web` + `db` services): `docker compose up --build`

## Backend config quirks
- Default settings module is always `barberia_project.settings` (`manage.py`, `wsgi.py`, `asgi.py`); `settings_production.py` exists but is not auto-selected.
- Local DB config defaults to PostgreSQL host `db` (from Docker Compose). If running Django outside Docker, set `DB_HOST` (typically `localhost`) plus `POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD`.
- API root is `api/v1/` from `barberia_project/urls.py`.

## Multi-tenant behavior (easy to break)
- Business context is set by `core.middleware.NegocioContextMiddleware` from `X-Negocio-ID` header or `negocio_id` query param.
- Many API permissions depend on `request.negocio`; for authenticated non-superusers, missing/invalid negocio context will deny access.
- Frontend stores `negocio_id` and sends it per request; keep this contract when changing auth/reservas endpoints.

## Mobile app commands (Expo)
- In `barberia-app/`: `npm install`, then `npm run start` (or `npm run android` / `npm run ios` / `npm run web`).
- TypeScript uses strict mode (`barberia-app/tsconfig.json`); run `npx tsc --noEmit` for focused validation (no lint/test scripts are defined).

## Mobile/backend integration gotcha
- `barberia-app/src/api/apiURL.ts` is hardcoded to production (`https://ordema.app/api/v1`). For local backend work, switch this constant explicitly.

## Source-of-truth notes
- Use Django models + migrations in `core/migrations/` as schema truth. `database_schema.sql` is a legacy MySQL dump and may not match current PostgreSQL runtime.
- There is effectively no backend test suite yet (`core/tests.py` stub). Prefer targeted manual endpoint checks after backend changes.

## Deployment/safety
- `render.yaml` start command includes inline superuser creation with literal credentials. Treat this as sensitive debt; do not replicate hardcoded secrets in new changes.
