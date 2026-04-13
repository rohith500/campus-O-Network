# Sprint 3 – Campus-O-Network

## Team Members
- Nitin Avula – 12255254
- Rohith Reddy Nama – 69965665

## Work Completed in Sprint 3

### Backend (Nitin Avula)
- User Profile API: get and update profile (`GET /profile`, `PUT /profile`)
- Post Likes API: like a post (`POST /feed/{id}/like`)
- Comments API: add, list, delete comments (`GET /feed/{id}/comments`, `POST /feed/{id}/comments`, `DELETE /feed/{id}/comments/{commentId}`)
- Added `user_profiles` and `comments` tables via SQLite migrations
- Extended `db.Database` interface with 6 new methods
- 19 new unit tests for the Sprint 3 backend work

### Backend Authorization Hardening
- Added reusable role-based authorization middleware in `backend/internal/middleware/auth.go`.
- Enforced admin-only access for student write routes in `backend/cmd/api/main.go`.
- Kept defense-in-depth checks in `backend/internal/handlers/students.go`.
- Added route-level RBAC tests in `backend/cmd/api/main_test.go`.
- Added middleware authorization tests in `backend/internal/middleware/auth_test.go`.
- Verified the backend with `go test ./...` after the RBAC changes.

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

### Authorization Hardening Tests
| Test | Result |
|---|---|
| TestRequireRole_UnauthorizedWithoutToken | PASS |
| TestRequireRole_ForbiddenForWrongRole | PASS |
| TestRequireRole_AllowsMatchingRole | PASS |
| TestStudentsRoute_UnauthorizedWithoutToken | PASS |
| TestStudentsRoute_ForbiddenForStudentRoleOnCreate | PASS |
| TestStudentsRoute_AllowsAdminCreate | PASS |
| TestStudentsByIDRoute_ForbiddenForStudentRoleOnUpdate | PASS |

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
go test ./...
```
