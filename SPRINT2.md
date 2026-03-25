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
Team Members

### Backend Team

Nitin Avula - 12255254

Rohith Reddy Nama - 69965665

### Frontend Team

Yash Chaudhari - 22603734

Ashmit Sharma - 28381009

## FRONTEND:

## Backlog from sprint 1

Search page for student clubs - As an user i should be able to search for existing clubs

### Sprint 2 User Stories
https://github.com/users/rohith500/projects/3/views/3


1. Add API client scaffolding for new backend modules (Clubs/Events/StudyGroups) - As a frontend developer I want a consistent API client layer for the new backend features so that the UI can call backend endpoints reliably and handle auth/errors consistently.

2. Define frontend data models/types for Clubs, Events, Study Groups - As a frontend developer I want typed models aligned with backend responses so that UI development is fast and runtime errors are minimized.

3. Clubs — Build Clubs List (Discovery) page - As a student user I want to browse and search clubs so that I can find communities to join.

4. Clubs — Build Club Details page (Membership + details) - As a student user I want to view club details and membership status so that I can decide to join and participate.

5. Clubs — Create/Edit Club (Admin/Owner flow) - As a club admin/owner I want to create and manage a club so that I can maintain accurate club information.

6. Events — Build Events List page (Browse upcoming events) - As a student user I want to see upcoming events so that I can plan to attend campus activities.

7. Events — Event Details + RSVP workflow - As a student user I want to view event details and RSVP so that I can signal attendance and get reminders/updates.

8. Events — Create/Edit Event (Organizer flow) - As an event organizer (club admin or authorized user) I want to create and edit events so that I can promote and manage campus activities.

9. Study Groups — Discovery + Details + Join/Leave workflow - As a student user I want to find and join study groups so that I can collaborate with peers for courses/topics.


### Issues Planned for Sprint 2

Add API client scaffolding for new backend modules (Clubs/Events/StudyGroups)

Define frontend data models/types for Clubs, Events, Study Groups

Clubs — Build Clubs List (Discovery) page

Clubs — Build Club Details page (Membership + details)

Clubs — Create/Edit Club (Admin/Owner flow)

Events — Build Events List page (Browse upcoming events)

Events — Event Details + RSVP workflow

Events — Create/Edit Event (Organizer flow)

Study Groups — Discovery + Details + Join/Leave workflow



### Successfully Completed

Search page for student clubs

Add API client scaffolding for new backend modules (Clubs/Events/StudyGroups)

Define frontend data models/types for Clubs, Events, Study Groups

Clubs — Build Clubs List (Discovery) page

Clubs — Build Club Details page (Membership + details)

Clubs — Create/Edit Club (Admin/Owner flow)

Events — Build Events List page (Browse upcoming events)

Events — Event Details + RSVP workflow

Events — Create/Edit Event (Organizer flow)

Study Groups — Discovery + Details + Join/Leave workflow



### Not Completed in Sprint 2 and Reasons

Event Details and RSVP Workflow
- need some changes on the backend side for this to work

## Unit tests

- `frontend/src/app/app.spec.ts` — app creation and router-outlet render checks.
- `frontend/src/app/core/auth.interceptor.spec.ts` — auth header added for API URLs and skipped for non-API URLs.
- `frontend/src/app/core/role.guard.spec.ts` — role-based allow/deny + redirect to feed.
- `frontend/src/app/core/api/api.utils.spec.ts` — params builder, pagination, and API error/result mapping.

## Cypress test

- `frontend/cypress/e2e/spec.cy.ts` — sign-up flow (open register page, fill form, submit Create Account).


### Sprint 2 Summary

Sprint 2 focused on adding full Clubs, Events, and Study Groups functionality to the frontend, including a consistent API client layer, shared typed data models, discovery + details pages, and membership/RSVP workflows. Cross-cutting UI improvements were also completed to ensure consistent loading states, notifications, and error handling across the new modules.
