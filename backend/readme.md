## Backend (Go)

### Run locally
```bash
go run ./cmd/api
```

### Environment
- `PORT` (default: `8080`)
- `DB_PATH` (default: `./data/campus_o_network.db`)
- `JWT_KEY` (default: `your-secret-key`)

### Sprint 1 API
- `GET /health` - API health check
- `POST /auth/register` - register (`name`, `email`, `password`)
- `POST /auth/login` - login and receive JWT token
- `GET /feed?limit=10&offset=0` - public feed listing
- `POST /feed/create` - create post (requires `Authorization: Bearer <token>`)
- `GET|POST /students` - list/create students (JWT required)
- `GET|PUT|DELETE /students/{id}` - student by id (JWT required)
