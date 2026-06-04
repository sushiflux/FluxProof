# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Starting the app

```bash
./start.sh   # starts Docker DB, backend (5225) and frontend (5173) together
```

Logs land in `/tmp/fluxproof-api.log` and `/tmp/fluxproof-fe.log`.

**Manual start:**
```bash
# Backend
export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
dotnet run --project src/FluxProof.API/FluxProof.API.csproj --launch-profile http

# Frontend
cd frontend && npm run dev
```

## Frontend commands (in `frontend/`)

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # TypeScript check + production bundle
npm run lint     # ESLint
```

## Backend / database commands (from repo root)

```bash
dotnet build                                    # build solution
dotnet-ef migrations add <Name>                 # new migration
dotnet-ef database update                       # apply migrations manually
```

Migrations run automatically on API startup via `DbSeeder`. The dev DB is PostgreSQL 17 in Docker (`FluxProof-Postgres`, port **5433**).

## Architecture

**4-layer Clean Architecture:**

```
Domain          → Entities, Enums (no dependencies)
Application     → DTOs, Interfaces only (depends on Domain)
Infrastructure  → EF Core DbContext, all Services, Migrations (depends on both)
API             → Controllers, CurrentUserService, Program.cs (depends on all)
```

Services live in **Infrastructure** (not Application) to avoid circular dependencies — Application only knows about Domain.

**Frontend** (`frontend/src/`):
- State: Zustand (`store/`) for auth + theme
- Server state: TanStack Query with 30 s stale time
- Routing: React Router v7, two layout trees: `/app/*` (UserLayout) and `/admin/*` (AdminLayout)
- Styling: Tailwind v4 CSS-first, dark mode via `.dark` class on `<html>`

**Key domain rules:**
- Revisions are **immutable** — never edited or deleted in production, only replaced (old one flagged `isReplaced`)
- Version format: `Major.Minor.Patch`; bump logic driven by highest-ranked badge in a revision (Update → Major, Fix → Patch, everything else → Minor)
- `ProjectPermissions` controls per-user access; Admins/Developers bypass it

## Environment

| Variable | Value |
|---|---|
| `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT` | `1` (required — no ICU installed) |
| `ASPNETCORE_ENVIRONMENT` | `Development` / `Production` |
| `ASPNETCORE_URLS` | `http://localhost:5225` |
| `PATH` | must include `~/.dotnet` and `~/.dotnet/tools` |

Dev connection string (in `appsettings.Development.json`):
`Host=localhost;Port=5433;Database=fluxproof-db;Username=flux;Password=flux`

Default seeded users: `admin/admin` (Admin role), `dev/dev` (Developer role, DEV only).

## Roles & panels

| Role | Access |
|---|---|
| Admin | Admin panel only |
| User | User panel only |
| Developer | Both panels + switch button (only rendered when `IS_DEV = true`) |
