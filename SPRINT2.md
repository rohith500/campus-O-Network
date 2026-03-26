# Sprint 2 – Campus-O-Network

## Team Members
- Nitin Avula – 12255254
- Rohith Reddy Nama – 69965665

## Sprint 2 Scope (Backend)
Sprint 2 focused on improving backend quality and reviewability through:
1. Detailed API documentation for all active backend endpoints.
2. Unit tests using Go's native testing stack (`testing`, `net/http/httptest`).
3. Function-level coverage improvements across handlers and auth utilities.

## Backend Framework and Testing Approach
- **Language/Runtime:** Go (`net/http`, `http.ServeMux`).
- **Auth Model:** JWT Bearer token (`Authorization: Bearer <token>`).
- **Test Style:** Handler unit tests with a `mockDB` implementing `db.Database`.
- **Tools:** `go test`, `httptest.NewRequest`, `httptest.NewRecorder`.
- **Goal:** Near 1:1 function-to-test ratio (at least one focused test per exported behavior, with extra tests for edge/error paths).

---

## API Reference (Detailed)

### Base Notes
- Base URL (local): `http://localhost:<PORT>`
- Protected endpoints require header:
  - `Authorization: Bearer <jwt_token>`
- Most handler responses are JSON; errors use `http.Error` plain text with status code.

### Why We Use APIs in Campus-O-Network
APIs are the contract between frontend and backend in this project. They are used to:
- **Connect UI to data/services:** Angular frontend calls backend endpoints to fetch feed, clubs, events, and study groups.
- **Enforce security boundaries:** Authentication and authorization are centralized through API middleware (JWT), not handled in frontend logic.
- **Standardize communication:** Request/response formats make behavior predictable for web clients, tests, and future mobile clients.
- **Isolate business logic:** Validation, role checks, and persistence happen in backend handlers/services, keeping frontend lightweight.
- **Enable testability and scalability:** APIs can be unit-tested independently and later scaled or versioned without rewriting frontend pages.

## 1) Health

### `GET /health`
**Purpose:** Verify API service is running.

**Success Response (`200`):**
```json
{
  "status": "ok",
  "message": "Campus-O-Network API is running",
  "timestamp": "2026-03-25T17:00:00Z"
}
```

**Errors:**
- `405` method not allowed

---

## 2) Authentication

### `POST /auth/register`
**Purpose:** Register a new user.

**Request Body:**
```json
{
  "email": "alice@ufl.edu",
  "password": "secret123",
  "name": "Alice"
}
```

**Behavior:**
- Email is normalized to lowercase and trimmed.
- Name is trimmed.
- Password is hashed using bcrypt.
- New users are created with role `student`.
- JWT token is generated on success.

**Success Response (`200`):**
```json
{
  "user": {
    "id": 1,
    "email": "alice@ufl.edu",
    "name": "Alice",
    "role": "student",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "<jwt>"
}
```

**Errors:**
- `405` method not allowed
- `400` invalid request / missing required fields / DB create user failure
- `500` password hashing failure / token generation failure

### `POST /auth/login`
**Purpose:** Authenticate existing user and return JWT.

**Request Body:**
```json
{
  "email": "alice@ufl.edu",
  "password": "secret123"
}
```

**Success Response (`200`):**
```json
{
  "user": {
    "id": 1,
    "email": "alice@ufl.edu",
    "name": "Alice",
    "role": "student"
  },
  "token": "<jwt>"
}
```

**Errors:**
- `405` method not allowed
- `400` invalid request / missing required fields
- `401` invalid credentials (user not found or password mismatch)
- `500` token generation failure

---

## 3) Feed

### `GET /feed`
**Purpose:** Get feed posts with pagination.

**Query Params:**
- `limit` (optional, default `10`, max `100`)
- `offset` (optional, default `0`)

**Success Response (`200`):**
```json
[
  {
    "id": 10,
    "user_id": 1,
    "content": "Hello campus",
    "tags": "announcement",
    "likes": 0,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

**Errors:**
- `405` method not allowed
- `500` failed to get feed

### `POST /feed/create` *(Protected)*
**Purpose:** Create a feed post.

**Request Body:**
```json
{
  "content": "Welcome to Campus-O-Network!",
  "tags": "announcement,intro"
}
```

**Success Response (`200`):** returns created post object.

**Errors:**
- `401` unauthorized / missing or invalid token
- `400` invalid request / missing content
- `405` method not allowed
- `500` create post failure

---

## 4) Students *(Protected)*

### `GET /students`
List all students.

**Success (`200`):**
```json
{ "ok": true, "students": [ ... ] }
```

### `POST /students`
Create a student.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@ufl.edu",
  "major": "Computer Science",
  "year": 3
}
```

**Success (`200`):**
```json
{ "ok": true, "studentId": 12 }
```

### `GET /students/{id}`
Get student by ID.

### `PUT /students/{id}`
Update student by ID.

### `DELETE /students/{id}`
Delete student by ID.

**Common Errors:**
- `401` unauthorized
- `400` invalid path / invalid id / invalid json / DB validation errors
- `404` student not found (`GET /students/{id}`)
- `405` method not allowed

---

## 5) Clubs

### `GET /clubs`
List all clubs.

**Success (`200`):**
```json
{ "ok": true, "clubs": [ ... ] }
```

### `POST /clubs` *(Protected)*
Create a club.

**Request Body:**
```json
{
  "name": "Go Club",
  "description": "Students learning Go"
}
```

**Success (`201`):**
```json
{ "ok": true, "club": { ... } }
```

### `GET /clubs/{id}`
Get club details + member list.

**Success (`200`):**
```json
{ "ok": true, "club": { ... }, "members": [ ... ] }
```

### `POST /clubs/{id}/join` *(Protected)*
Join club.

**Request Body (optional role):**
```json
{ "role": "member" }
```
If role is empty, defaults to `member`.

**Success (`200`):**
```json
{ "ok": true, "message": "joined club" }
```

### `DELETE /clubs/{id}/leave` *(Protected)*
Leave club.

**Success (`200`):**
```json
{ "ok": true, "message": "left club" }
```

**Common Errors:**
- `400` invalid request/path/id
- `401` unauthorized
- `404` club not found (`GET /clubs/{id}`)
- `500` join/leave/create/list failures

---

## 6) Events

### `GET /events`
List events. Supports filter:
- `club_id` (optional)

**Success (`200`):**
```json
{ "ok": true, "events": [ ... ] }
```

### `POST /events` *(Protected)*
Create event.

**Request Body:**
```json
{
  "clubId": 1,
  "title": "UF Hackathon",
  "description": "Build projects",
  "location": "Innovation Hub",
  "date": "2026-04-01T10:00:00Z",
  "capacity": 200
}
```

**Notes:**
- `title` and `date` are required.
- `date` must be RFC3339.
- If capacity <= 0, server defaults to `100`.

**Success (`201`):**
```json
{ "ok": true, "event": { ... } }
```

### `GET /events/{id}`
Get event details + RSVPs.

**Success (`200`):**
```json
{ "ok": true, "event": { ... }, "rsvps": [ ... ] }
```

### `POST /events/{id}/rsvp` *(Protected)*
RSVP to event.

**Request Body:**
```json
{ "status": "going" }
```

Valid statuses: `going`, `maybe`, `not_going`.

**Success (`200`):**
```json
{ "ok": true, "message": "RSVP recorded", "status": "going" }
```

**Common Errors:**
- `400` invalid date / invalid status / invalid id
- `401` unauthorized
- `404` event not found (`GET /events/{id}`)
- `500` create/list/rsvp DB failures

---

## 7) Study Requests and Study Groups

### `GET /study/requests`
List open study requests.

**Success (`200`):**
```json
{ "ok": true, "requests": [ ... ] }
```

### `POST /study/requests` *(Protected)*
Create study request.

**Request Body:**
```json
{
  "course": "COP4600",
  "topic": "Memory Management",
  "availability": "weekends",
  "skillLevel": "intermediate"
}
```

`course` and `topic` are required.

**Success (`201`):**
```json
{ "ok": true, "request": { ... } }
```

### `GET /study/groups`
List study groups.

**Success (`200`):**
```json
{ "ok": true, "groups": [ ... ] }
```

### `POST /study/groups` *(Protected)*
Create study group.

**Request Body:**
```json
{
  "course": "CAP5771",
  "topic": "Neural Networks",
  "maxMembers": 5
}
```

`course` and `topic` are required.
If `maxMembers <= 0`, default is `5`.

**Success (`201`):**
```json
{ "ok": true, "group": { ... } }
```

### `POST /study/groups/{id}/join` *(Protected)*
Join a study group.

**Success (`200`):**
```json
{ "ok": true, "message": "joined study group", "members": [ ... ] }
```

**Common Errors:**
- `400` invalid request/path/id
- `401` unauthorized
- `500` create/list/join failures

---

## Unit Testing Summary

### Current Unit Tests Added (Sprint 2)
- Handler tests in `backend/internal/handlers/sprint2_test.go`
- Auth utility tests in `backend/internal/auth/auth_test.go`

### Unit Test Framework Details
- `testing.T` for assertions
- `httptest.NewRequest` + `httptest.NewRecorder` for HTTP simulation
- In-memory `mockDB` for deterministic behavior
- Auth context injection via JWT claims for protected route testing

### Function-to-Test Coverage Mapping (1:1 Target)

| Backend Function/Behavior | Representative Unit Test(s) |
|---|---|
| `Register` | `TestRegister_MethodNotAllowed`, `TestRegister_MissingFields`, `TestRegister_DBError`, `TestRegister_Success` |
| `Login` | `TestLogin_MethodNotAllowed`, `TestLogin_MissingFields`, `TestLogin_UserNotFound`, `TestLogin_WrongPassword`, `TestLogin_Success` |
| `GetFeed` | `TestGetFeed_MethodNotAllowed`, `TestGetFeed_Empty`, `TestGetFeed_WithPosts` |
| `CreatePost` | `TestCreatePost_Unauthorized`, `TestCreatePost_MissingContent`, `TestCreatePost_Success` |
| `ListClubs` | `TestListClubs_Empty`, `TestListClubs_MethodNotAllowed`, `TestListClubs_WithData` |
| `CreateClub` | `TestCreateClub_Success`, `TestCreateClub_MissingName`, `TestCreateClub_Unauthorized` |
| `GetClub` | `TestGetClub_NotFound`, `TestGetClub_Success` |
| `JoinClub` | `TestJoinClub_Success` |
| `LeaveClub` | `TestLeaveClub_Success`, `TestLeaveClub_NotMember` |
| `ListEvents` | `TestListEvents_Empty`, `TestListEvents_FilterByClub` |
| `CreateEvent` | `TestCreateEvent_Success`, `TestCreateEvent_MissingTitle`, `TestCreateEvent_InvalidDate` |
| `GetEvent` | `TestGetEvent_NotFound`, `TestGetEvent_Success` |
| `RSVPEvent` | `TestRSVPEvent_Success`, `TestRSVPEvent_InvalidStatus`, `TestRSVPEvent_Unauthorized` |
| `ListStudyRequests` | `TestListStudyRequests_Empty` |
| `CreateStudyRequest` | `TestCreateStudyRequest_Success`, `TestCreateStudyRequest_MissingTopic`, `TestCreateStudyRequest_MissingCourse` |
| `ListStudyGroups` | `TestListStudyGroups_Empty`, `TestListStudyGroups_WithData` |
| `CreateStudyGroup` | `TestCreateStudyGroup_Success`, `TestCreateStudyGroup_DefaultMaxMembers` |
| `JoinStudyGroup` | `TestJoinStudyGroup_Success`, `TestJoinStudyGroup_Unauthorized`, `TestJoinStudyGroup_NotFound` |
| `HashPassword` | `TestHashPassword` |
| `VerifyPassword` | `TestVerifyPassword_Correct`, `TestVerifyPassword_Wrong` |
| `GenerateToken` | `TestGenerateToken` |
| `ValidateToken` | `TestValidateToken_Valid`, `TestValidateToken_Invalid` |

### Test Execution Commands
Run from `backend/`:
```bash
go test ./internal/handlers/ -v
go test ./internal/auth/ -v
go test ./... -v
```

### Coverage Statement
The Sprint 2 test suite provides at least one direct unit test for each major backend handler behavior and each core auth utility function, meeting the intended 1:1 unit-test-to-function expectation while also including additional edge/error case tests.

---

## Sprint 2 Backend Outcome
- Backend API is documented endpoint-by-endpoint with methods, auth requirements, request contracts, response contracts, and error codes.
- Unit tests are framework-specific (Go + `httptest`) and validate both success and failure paths.
- The previous uncertainty around authentication implementation is now resolved with explicit, verifiable test coverage.