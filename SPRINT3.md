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
- Registered all Sprint 2 + Sprint 3 routes in `main.go` (clubs, events, study groups, profile, likes, comments)
- Fixed feed query to JOIN users table and return author name with each post
- 19 new unit tests (65 total passing)

## Backend Unit Tests

### All 65 Passing Tests

| Test | Sprint | Result |
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
| POST | /auth/register | No | Register a new user |
| POST | /auth/login | No | Login and receive JWT |

### Feed
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /feed | No | List posts (paginated, includes author name) |
| POST | /feed/create | Yes | Create a post |
| POST | /feed/{id}/like | Yes | Like a post |
| GET | /feed/{id}/comments | No | List comments on a post |
| POST | /feed/{id}/comments | Yes | Add a comment |
| DELETE | /feed/{id}/comments/{commentId} | Yes | Delete your comment |

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
