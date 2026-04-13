# Sprint 3 – Campus-O-Network

## Team Members
- Nitin Avula – 12255254
- Rohith Reddy Nama – 69965665

## Work Completed in Sprint 3

### Backend (Nitin Avula)

- **User Profile API** — `GET /profile` and `PUT /profile` with upsert logic so students can create or update their bio, interests, availability, and skill level
- **Post Likes API** — `POST /feed/{id}/like` increments like count on any post
- **Comments API** — full CRUD: list comments (`GET /feed/{id}/comments`), add a comment (`POST /feed/{id}/comments`), and delete your own comment (`DELETE /feed/{id}/comments/{commentId}`)
- **SQLite Migrations** — added `user_profiles` and `comments` tables with indexes on `user_id` and `post_id` for query performance
- **Database Interface** — extended `db.Database` interface with 6 new methods: `GetProfileByUserID`, `UpsertProfile`, `CreateComment`, `GetCommentByID`, `GetCommentsByPostID`, `DeleteComment`
- **Route Registration** — wired all Sprint 2 and Sprint 3 routes into `main.go` (clubs, events, study groups, profile, likes, comments were all implemented but not registered)
- **Feed Author Fix** — fixed `GetAllPosts` and `GetPostByID` to JOIN the `users` table and return `AuthorName` with each post so the frontend can display real names
- **19 new unit tests** — 65 total passing across all handlers

## Backend Unit Tests

### Sprint 3 New Tests (19)

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
| TestGetComments_AfterCreate | PASS |
| TestCreateComment_Success | PASS |
| TestCreateComment_MissingContent | PASS |
| TestCreateComment_Unauthorized | PASS |
| TestDeleteComment_Success | PASS |
| TestDeleteComment_Unauthorized | PASS |

### All 65 Passing Tests (Sprint 2 + Sprint 3)

| Test | Area | Result |
|---|---|---|
| TestRegister_MethodNotAllowed | Auth | PASS |
| TestRegister_MissingFields | Auth | PASS |
| TestRegister_DBError | Auth | PASS |
| TestRegister_Success | Auth | PASS |
| TestLogin_MethodNotAllowed | Auth | PASS |
| TestLogin_MissingFields | Auth | PASS |
| TestLogin_UserNotFound | Auth | PASS |
| TestLogin_WrongPassword | Auth | PASS |
| TestLogin_Success | Auth | PASS |
| TestGetFeed_MethodNotAllowed | Feed | PASS |
| TestGetFeed_Empty | Feed | PASS |
| TestGetFeed_WithPosts | Feed | PASS |
| TestCreatePost_Unauthorized | Feed | PASS |
| TestCreatePost_MissingContent | Feed | PASS |
| TestCreatePost_Success | Feed | PASS |
| TestListClubs_Empty | Clubs | PASS |
| TestListClubs_MethodNotAllowed | Clubs | PASS |
| TestListClubs_WithData | Clubs | PASS |
| TestCreateClub_Success | Clubs | PASS |
| TestCreateClub_MissingName | Clubs | PASS |
| TestCreateClub_Unauthorized | Clubs | PASS |
| TestGetClub_NotFound | Clubs | PASS |
| TestGetClub_Success | Clubs | PASS |
| TestJoinClub_Success | Clubs | PASS |
| TestLeaveClub_Success | Clubs | PASS |
| TestLeaveClub_NotMember | Clubs | PASS |
| TestListEvents_Empty | Events | PASS |
| TestListEvents_FilterByClub | Events | PASS |
| TestCreateEvent_Success | Events | PASS |
| TestCreateEvent_MissingTitle | Events | PASS |
| TestCreateEvent_InvalidDate | Events | PASS |
| TestGetEvent_NotFound | Events | PASS |
| TestGetEvent_Success | Events | PASS |
| TestRSVPEvent_Success | Events | PASS |
| TestRSVPEvent_InvalidStatus | Events | PASS |
| TestRSVPEvent_Unauthorized | Events | PASS |
| TestListStudyRequests_Empty | Study | PASS |
| TestCreateStudyRequest_Success | Study | PASS |
| TestCreateStudyRequest_MissingTopic | Study | PASS |
| TestCreateStudyRequest_MissingCourse | Study | PASS |
| TestListStudyGroups_Empty | Study | PASS |
| TestListStudyGroups_WithData | Study | PASS |
| TestCreateStudyGroup_Success | Study | PASS |
| TestCreateStudyGroup_DefaultMaxMembers | Study | PASS |
| TestJoinStudyGroup_Success | Study | PASS |
| TestJoinStudyGroup_Unauthorized | Study | PASS |
| TestJoinStudyGroup_NotFound | Study | PASS |
| TestGetProfile_NoProfile | Profile | PASS |
| TestGetProfile_Unauthorized | Profile | PASS |
| TestGetProfile_MethodNotAllowed | Profile | PASS |
| TestUpdateProfile_Success | Profile | PASS |
| TestUpdateProfile_Unauthorized | Profile | PASS |
| TestUpdateProfile_MethodNotAllowed | Profile | PASS |
| TestGetProfile_AfterUpdate | Profile | PASS |
| TestLikePost_Success | Likes | PASS |
| TestLikePost_Unauthorized | Likes | PASS |
| TestLikePost_MethodNotAllowed | Likes | PASS |
| TestLikePost_PostNotFound | Likes | PASS |
| TestGetComments_Empty | Comments | PASS |
| TestGetComments_MethodNotAllowed | Comments | PASS |
| TestGetComments_AfterCreate | Comments | PASS |
| TestCreateComment_Success | Comments | PASS |
| TestCreateComment_MissingContent | Comments | PASS |
| TestCreateComment_Unauthorized | Comments | PASS |
| TestDeleteComment_Success | Comments | PASS |
| TestDeleteComment_Unauthorized | Comments | PASS |

## Backend API Documentation

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register new user, returns JWT |
| POST | /auth/login | No | Login, returns JWT |

### Feed
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /feed | No | List posts paginated, includes author name |
| POST | /feed/create | Yes | Create a post |
| POST | /feed/{id}/like | Yes | Like a post |
| GET | /feed/{id}/comments | No | List comments on a post |
| POST | /feed/{id}/comments | Yes | Add a comment |
| DELETE | /feed/{id}/comments/{commentId} | Yes | Delete your own comment |

### Profile (Sprint 3)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /profile | Yes | Get current user profile |
| PUT | /profile | Yes | Create or update profile |

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
