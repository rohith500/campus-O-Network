# Sprint 3 – Campus-O-Network

## Team Members
- Nitin Avula – 12255254 (Backend)
- Rohith Reddy Nama – 69965665 (Backend)
- Yash Chaudhari - 22603734 (Frontend)
- Ashmit Sharma - 28381009 (Frontend)

## Work Completed in Sprint 3

### Backend (Nitin Avula)
- User Profile API: get and update profile (`GET /profile`, `PUT /profile`)
- Post Likes API: like a post (`POST /feed/{id}/like`)
- Comments API: add, list, delete comments (`GET /feed/{id}/comments`, `POST /feed/{id}/comments`, `DELETE /feed/{id}/comments/{commentId}`)
- Added `user_profiles` and `comments` tables via SQLite migrations
- Extended `db.Database` interface with 6 new methods
- 19 new unit tests (65 total passing)

## Backend Unit Tests

### Sprint 3 New Tests
| Test | Result |
|---|---|
| TestGetProfile_NoProfile | PASS |
| TestGetProfile_Unauthorized | PASS |
| TestGetProfile_MethodNotAllowed | PASS |
| TestUpdateProfile_Success | PASS |
| TestUpdateProfile_Unauthorized | PASS |
| TestUpdateProfile_MethodNotAllowed | PASS |
| TestGetProfile_AfterUpdate | PASS |
| TestLikePost_Success | PASS |
| TestLikePost_Unauthorized | PASS |
| TestLikePost_MethodNotAllowed | PASS |
| TestLikePost_PostNotFound | PASS |
| TestGetComments_Empty | PASS |
| TestGetComments_MethodNotAllowed | PASS |
| TestCreateComment_Success | PASS |
| TestCreateComment_MissingContent | PASS |
| TestCreateComment_Unauthorized | PASS |
| TestDeleteComment_Success | PASS |
| TestDeleteComment_Unauthorized | PASS |
| TestGetComments_AfterCreate | PASS |

## Backend API Documentation

### Profile (Sprint 3)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /profile | Yes | Get current user profile |
| PUT | /profile | Yes | Create or update profile |

### Feed + Likes + Comments (Sprint 3)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /feed | No | List posts (paginated) |
| POST | /feed/create | Yes | Create a post |
| POST | /feed/{id}/like | Yes | Like a post |
| GET | /feed/{id}/comments | No | List comments on a post |
| POST | /feed/{id}/comments | Yes | Add a comment |
| DELETE | /feed/{id}/comments/{commentId} | Yes | Delete your comment |

### Clubs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /clubs | No | List all clubs |
| POST | /clubs | Yes | Create a club |
| GET | /clubs/{id} | No | Get club + members |
| POST | /clubs/{id}/join | Yes | Join a club |
| DELETE | /clubs/{id}/leave | Yes | Leave a club |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /events | No | List all events |
| POST | /events | Yes | Create an event |
| GET | /events/{id} | No | Get event + RSVPs |
| POST | /events/{id}/rsvp | Yes | RSVP to event |

### Study Groups
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /study/requests | No | List open study requests |
| POST | /study/requests | Yes | Post a study request |
| GET | /study/groups | No | List active study groups |
| POST | /study/groups | Yes | Create a study group |
| POST | /study/groups/{id}/join | Yes | Join a study group |

## Running Tests
```bash
cd backend
go test ./internal/handlers/... -v
```

### Frontend (Yash Chaudhari, Ashmit Sharma)

#### Frontend Team Members
- Yash Chaudhari - 22603734
- Ashmit Sharma - 28381009

#### Frontend Changes Completed in Sprint 3 
- Added RSVP actions in events list with optimistic status updates and inline error handling (`POST /events/{id}/rsvp`).
- Integrated feed likes and comments UX with protected create/delete actions and lazy-loaded comment panels.
- Added post composer on `/feed` with content validation and publish flow (`POST /feed/create`).
- Fixed frontend response mapping for Go JSON field casing (`ID`, `UserID`, `Content`, `Likes`) to avoid feed/interaction mismatches.
- Added frontend-side like memory per user to prevent repeated likes from the same UI session (temporary guard).
- Reduced feed clutter by showing only 3 events preview and added post pagination (8 posts per page).

#### Frontend Backlog from Sprint 2 Completed in Sprint 3
- Connected protected feed creation flow from Sprint 2 API docs to the feed composer (`POST /feed/create`).
- Connected event RSVP flow from Sprint 2 API docs to events list actions (`POST /events/{id}/rsvp`).

#### Frontend Work Remaining
- Implement memory for likes (not completed because true enforcement requires backend changes).
- Show user's name instead of user number in feed/comments (requires backend to return author display names).
- Add delete post feature in frontend (pending backend route wiring and ownership rules).

## Frontend Unit Tests

### File: `frontend/src/app/app.spec.ts` (Component: App)
- `should create the app`: verifies the root app component is created successfully.
- `should render router outlet host`: verifies router outlet is rendered in the root template.

### File: `frontend/src/app/core/auth.interceptor.spec.ts` (Module: Auth Interceptor)
- `adds Authorization header for API base URL when token exists`: verifies API requests include Bearer token.
- `does not add Authorization header for non-API URLs`: verifies external requests are not modified.

### File: `frontend/src/app/core/role.guard.spec.ts` (Module: Role Guard)
- `allows access when user role is in allowed roles`: verifies role-guard grants access for valid roles.
- `redirects to feed when role is not allowed`: verifies role-guard blocks unauthorized roles and redirects.

### File: `frontend/src/app/core/api/api.utils.spec.ts` (Module: API Utils)
- `buildHttpParams should include only non-empty values`: verifies query params skip empty/undefined values.
- `applyClientPagination should return paged items with metadata`: verifies client pagination output shape.
- `normalizeApiError should map HttpErrorResponse status to structured code`: verifies error normalization mapping.
- `mapToApiResult should wrap successful results`: verifies success values are wrapped as `{ ok: true }`.
- `mapToApiResult should wrap thrown errors into unified error shape`: verifies errors are wrapped as `{ ok: false }` with normalized metadata.

### File: `frontend/src/app/events/events-list/events-list.spec.ts` (Component: EventsList)
- `optimistically updates RSVP and prevents duplicate submit while in flight`: verifies optimistic RSVP UI and in-flight request lock.
- `redirects to login when user attempts RSVP without token`: verifies unauthenticated RSVP redirects to `/auth/login`.
- `surfaces inline 400 error and reverts optimistic status`: verifies validation error messaging and rollback.
- `surfaces inline 404 error and reverts optimistic status`: verifies not-found error messaging and rollback.
- `surfaces inline 401 error and redirects to login`: verifies unauthorized handling and redirect.

### File: `frontend/src/app/feed/feed.spec.ts` (Component: Feed)
- `likes optimistically and prevents duplicate like while request is pending`: verifies optimistic like count update and in-flight lock.
- `rolls back optimistic like on error`: verifies like rollback and inline error handling.
- `redirects to login if unauthenticated user tries to like or comment`: verifies guarded feed interactions for unauthenticated users.
- `loads comments when opening comments panel`: verifies lazy comment fetch on first open.
- `adds comment optimistically then replaces temp comment with server result`: verifies optimistic comment create flow.
- `deletes own comment after successful API call`: verifies comment delete success updates local list.
- `prevents reliking the same post after a successful like`: verifies frontend one-like guard per post.
- `loads liked posts from storage on init`: verifies like memory restoration on feed load.
- `validates composer content before submit`: verifies empty post content is blocked with inline validation.
- `creates post and prepends to feed without reload, then resets composer`: verifies successful publish behavior.
- `prevents duplicate post submit while request is in flight`: verifies post submit lock while publishing.
- `shows user-facing 400 error when post create fails validation on backend`: verifies 400 handling copy for composer.
- `shows 401 error and redirects to login on unauthorized post create`: verifies unauthorized composer submit behavior.
- `paginates posts with at most 8 per page`: verifies page size and page navigation logic.
- `resets posts pagination to first page after creating a new post`: verifies new posts return feed to page 1.

