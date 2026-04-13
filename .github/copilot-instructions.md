# Project Guidelines

## Architecture
- This is a monorepo with two main apps:
  - `backend/`: Go HTTP API (`cmd/api/main.go`) with layered structure in `internal/`:
    - `handlers/` for HTTP endpoints and request validation
    - `middleware/` for CORS/auth context
    - `auth/` for JWT/password utilities
    - `db/` for repository interfaces and SQLite implementation
    - `models/` for domain entities
  - `frontend/`: Angular app with route-level guards and service-based API access in `src/app/core/`.
- Keep backend business logic in handler/db layers; avoid putting behavior in `main.go` beyond routing/wiring.

## Build and Test
- Backend:
  - `cd backend && go run ./cmd/api`
  - `cd backend && go test ./...`
  - `cd backend && go test ./internal/handlers/... -v`
- Frontend:
  - `cd frontend && npm install`
  - `cd frontend && npm start`
  - `cd frontend && npm run build`
  - `cd frontend && npm test`

## Conventions
- Backend handlers follow dependency injection via `handlers.New(database)` and the `db.Database` interface.
- Use JWT bearer auth for protected endpoints: `Authorization: Bearer <token>`.
- Preserve defensive input handling patterns used in handlers:
  - normalize strings (`TrimSpace`, lowercasing emails where relevant)
  - validate path/query/body values before DB calls
- Keep sensitive fields excluded from JSON responses (for example password fields tagged with `json:"-"`).
- Frontend API calls should stay in core services (`src/app/core/*.service.ts`) and return RxJS `Observable`s.
- Route access control is defined in `src/app/app.routes.ts` using `authGuard` and `roleGuard`; keep role checks in route metadata when adding protected pages.

## Environment and Pitfalls
- Backend defaults from `backend/internal/config/config.go`:
  - `PORT=8079`
  - `DB_TYPE=sqlite`
  - `DB_PATH=./data/campus_o_network.db`
  - `JWT_KEY` must be explicitly set for non-local/dev use.
- Use `.env.example` as the source of expected runtime variables.
- Frontend currently targets backend localhost APIs; keep frontend base URL and backend port aligned when changing environment settings.

## Reference Docs
- Project overview: `README.md`
- Backend quick reference: `backend/readme.md`
- Sprint/API details and test scope:
  - `SPRINT1.md`
  - `SPRINT2.md`
  - `SPRINT2_backend.md`
  - `SPRINT3.md`
  - `frontend/SPRINT1.md`
  - `backend/SPRINT1.md`
