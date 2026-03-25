# Sprint 2 Report – Campus-O-Network

## Team
- Nitin Avula – 12255254
- Rohith Reddy Nama – 69965665

## Sprint 2 Work Summary
Sprint 2 focused on closing quality gaps from Sprint 1 and proving backend feature reliability with unit tests. The main risk identified in Sprint 1 feedback was that authentication existed but was not test-backed, which made implementation confidence unclear. This sprint adds explicit tests for auth flows and broadens handler coverage for feed, clubs, events, and study groups.

## Sprint 2 User Stories
1. As a student, I can register and log in with validated credentials and receive a JWT token.
2. As a student, I can view feed posts and create posts when authenticated.
3. As a club member, I can list clubs, view club details, and manage membership actions.
4. As an event participant, I can browse events, filter by club, and RSVP securely.
5. As a student, I can create study requests, view study groups, and join valid groups.

## Auth API Documentation
### `POST /auth/register`
- Request body:
  - `email` (string, required)
  - `password` (string, required)
  - `name` (string, required)
- Success: `200 OK`
  - Returns `user` object and `token`
- Error cases:
  - `405 Method Not Allowed` (wrong method)
  - `400 Bad Request` (missing fields / registration failure)
  - `500 Internal Server Error` (token/hash generation failure)

### `POST /auth/login`
- Request body:
  - `email` (string, required)
  - `password` (string, required)
- Success: `200 OK`
  - Returns `user` object and `token`
- Error cases:
  - `405 Method Not Allowed` (wrong method)
  - `400 Bad Request` (missing fields)
  - `401 Unauthorized` (user not found / wrong password)

## Feed API Documentation
### `GET /feed`
- Query params:
  - `limit` (optional, default 10)
  - `offset` (optional, default 0)
- Success: `200 OK`
  - Returns feed post array
- Error cases:
  - `405 Method Not Allowed`
  - `500 Internal Server Error`

### `POST /feed/create`
- Auth: JWT required
- Request body:
  - `content` (string, required)
  - `tags` (string, optional)
- Success: `200 OK`
  - Returns created post
- Error cases:
  - `401 Unauthorized`
  - `400 Bad Request` (missing content)
  - `500 Internal Server Error`

## Clubs and Events API Documentation
### Clubs
- `GET /clubs` → List clubs (`200`)
- `GET /clubs/{id}` → Club details + members (`200`, `404`)
- `POST /clubs` (auth) → Create club (`201`, `400`, `401`)
- `POST /clubs/{id}/join` (auth) → Join club (`200`, `401`)
- `DELETE /clubs/{id}/leave` (auth) → Leave club (`200`, `401`, `500`)

### Events
- `GET /events` → List events, supports `club_id` filter (`200`)
- `GET /events/{id}` → Event details + RSVPs (`200`, `404`)
- `POST /events` (auth) → Create event (`201`, `400`, `401`)
- `POST /events/{id}/rsvp` (auth) → RSVP (`200`, `400`, `401`)

## Study Groups API Documentation
- `GET /study/requests` → List study requests (`200`)
- `POST /study/requests` (auth) → Create study request (`201`, `400`, `401`)
- `GET /study/groups` → List study groups (`200`)
- `POST /study/groups` (auth) → Create study group (`201`, `400`, `401`)
- `POST /study/groups/{id}/join` (auth) → Join group (`200`, `401`, `500`)

## Unit Test Summary
| Area | New Tests Added | Examples |
|---|---:|---|
| Auth handlers | 9 | `TestRegister_Success`, `TestLogin_WrongPassword` |
| Auth package | 6 | `TestHashPassword`, `TestValidateToken_Invalid` |
| Feed handlers | 6 | `TestGetFeed_WithPosts`, `TestCreatePost_Success` |
| Clubs handlers | 3 | `TestGetClub_Success`, `TestLeaveClub_NotMember` |
| Events handlers | 3 | `TestGetEvent_Success`, `TestRSVPEvent_Unauthorized` |
| Study handlers | 3 | `TestCreateStudyRequest_MissingCourse`, `TestJoinStudyGroup_NotFound` |
| **Total new tests** | **30** |  |

## Outcome
This sprint resolves the Sprint 1 ambiguity around auth implementation by adding deterministic auth test coverage and expands backend test coverage across core collaboration features. The backend behavior is now easier to validate during grading and future regressions are easier to catch.
