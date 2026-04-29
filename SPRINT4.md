# Sprint 4 - Campus-O-Network

## Team Members
- Nitin Avula - 12255254
- Rohith Reddy Nama - 69965665
- Yash Chaudhari - 22603734
- Ashmit Sharma - 28381009

## Work Completed in Sprint 4

### Backend (Nitin Avula)
- Toggle Like API: POST /feed/{id}/like toggles like/unlike using post_likes table with UNIQUE constraint
- Leave Study Group API: DELETE /study/groups/{id}/leave allows students to leave a group
- Get Study Group API: GET /study/groups/{id} returns full group details with member names
- Study Group Error Handling: GET /study/groups/{id} and POST /study/groups/{id}/join now fail safely if member lookup fails
- Relative Timestamps: feed posts return TimeAgo field computed server-side
- Member Names in Clubs and Study Groups via LEFT JOIN on users table
- Comment Author Names: feed comments now include AuthorName in API responses so the frontend can show real names instead of user numbers
- Added post_likes migration 007_create_post_likes.sql
- 2 new backend unit tests, 81 total passing

## Backend Unit Tests

### Sprint 4 New Tests

| Test | Result |
|---|---|
| TestToggleLike_LikeSuccess | PASS |
| TestToggleLike_Unauthorized | PASS |
| TestToggleLike_MethodNotAllowed | PASS |
| TestToggleLike_PostNotFound | PASS |
| TestLeaveStudyGroup_Success | PASS |
| TestLeaveStudyGroup_Unauthorized | PASS |
| TestLeaveStudyGroup_MethodNotAllowed | PASS |
| TestLeaveStudyGroup_NotMember | PASS |
| TestGetStudyGroup_Success | PASS |
| TestGetStudyGroup_NotFound | PASS |
| TestGetStudyGroup_MethodNotAllowed | PASS |
| TestGetComments_IncludesAuthorName | PASS |

| Test | Area |
|---|---|
| TestRegister_MethodNotAllowed | Auth |
| TestRegister_MissingFields | Auth |
| TestRegister_DBError | Auth |
| TestRegister_Success | Auth |
| TestLogin_MethodNotAllowed | Auth |
| TestLogin_MissingFields | Auth |
| TestLogin_UserNotFound | Auth |
| TestLogin_WrongPassword | Auth |
| TestLogin_Success | Auth |
| TestGetFeed_MethodNotAllowed | Feed |
| TestGetFeed_Empty | Feed |
| TestGetFeed_WithPosts | Feed |
| TestCreatePost_Unauthorized | Feed |
| TestCreatePost_MissingContent | Feed |
| TestCreatePost_Success | Feed |
| TestListClubs_Empty | Clubs |
| TestListClubs_MethodNotAllowed | Clubs |
| TestListClubs_WithData | Clubs |
| TestCreateClub_Success | Clubs |
| TestCreateClub_MissingName | Clubs |
| TestCreateClub_Unauthorized | Clubs |
| TestGetClub_NotFound | Clubs |
| TestGetClub_Success | Clubs |
| TestJoinClub_Success | Clubs |
| TestLeaveClub_Success | Clubs |
| TestLeaveClub_NotMember | Clubs |
| TestListEvents_Empty | Events |
| TestListEvents_FilterByClub | Events |
| TestCreateEvent_Success | Events |
| TestCreateEvent_MissingTitle | Events |
| TestCreateEvent_InvalidDate | Events |
| TestGetEvent_NotFound | Events |
| TestGetEvent_Success | Events |
| TestRSVPEvent_Success | Events |
| TestRSVPEvent_InvalidStatus | Events |
| TestRSVPEvent_Unauthorized | Events |
| TestListStudyRequests_Empty | Study |
| TestCreateStudyRequest_Success | Study |
| TestCreateStudyRequest_MissingTopic | Study |
| TestCreateStudyRequest_MissingCourse | Study |
| TestListStudyGroups_Empty | Study |
| TestListStudyGroups_WithData | Study |
| TestCreateStudyGroup_Success | Study |
| TestCreateStudyGroup_DefaultMaxMembers | Study |
| TestJoinStudyGroup_Success | Study |
| TestJoinStudyGroup_Unauthorized | Study |
| TestJoinStudyGroup_NotFound | Study |
| TestGetProfile_NoProfile | Profile |
| TestGetProfile_Unauthorized | Profile |
| TestGetProfile_MethodNotAllowed | Profile |
| TestUpdateProfile_Success | Profile |
| TestUpdateProfile_Unauthorized | Profile |
| TestUpdateProfile_MethodNotAllowed | Profile |
| TestGetProfile_AfterUpdate | Profile |
| TestLikePost_Success | Likes |
| TestLikePost_Unauthorized | Likes |
| TestLikePost_MethodNotAllowed | Likes |
| TestLikePost_PostNotFound | Likes |
| TestGetComments_Empty | Comments |
| TestGetComments_MethodNotAllowed | Comments |
| TestGetComments_AfterCreate | Comments |
| TestCreateComment_Success | Comments |
| TestCreateComment_MissingContent | Comments |
| TestCreateComment_Unauthorized | Comments |
| TestDeleteComment_Success | Comments |
| TestDeleteComment_Unauthorized | Comments |
| TestGetComments_IncludesAuthorName | Comments |
| TestGetStudyGroup_MemberLookupError | Sprint 4 |
| TestJoinStudyGroup_MemberLookupError | Sprint 4 |
| TestToggleLike_LikeSuccess | Sprint 4 |
| TestToggleLike_Unauthorized | Sprint 4 |
| TestToggleLike_MethodNotAllowed | Sprint 4 |
| TestToggleLike_PostNotFound | Sprint 4 |
| TestLeaveStudyGroup_Success | Sprint 4 |
| TestLeaveStudyGroup_Unauthorized | Sprint 4 |
| TestLeaveStudyGroup_MethodNotAllowed | Sprint 4 |
| TestLeaveStudyGroup_NotMember | Sprint 4 |
| TestGetStudyGroup_Success | Sprint 4 |
| TestGetStudyGroup_NotFound | Sprint 4 |
| TestGetStudyGroup_MethodNotAllowed | Sprint 4 |
| TestGetClub_MemberLookupError | Clubs |

## All 82 Passing Backend Tests

## Backend API Documentation

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register new user returns JWT |
| POST | /auth/login | No | Login returns JWT |

### Feed
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /feed | No | List posts with AuthorName and TimeAgo |
| POST | /feed/create | Yes | Create a post |
| POST | /feed/{id}/like | Yes | Toggle like or unlike |
| GET | /feed/{id}/comments | No | List comments with AuthorName |
| POST | /feed/{id}/comments | Yes | Add a comment and return AuthorName |
| DELETE | /feed/{id}/comments/{commentId} | Yes | Delete your comment |

### Profile
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /profile | Yes | Get current user profile |
| PUT | /profile | Yes | Create or update profile |

### Clubs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /clubs | No | List all clubs |
| POST | /clubs | Yes | Create a club |
| GET | /clubs/{id} | No | Get club with member names |
| POST | /clubs/{id}/join | Yes | Join a club |
| DELETE | /clubs/{id}/leave | Yes | Leave a club |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /events | No | List all events |
| POST | /events | Yes | Create an event |
| GET | /events/{id} | No | Get event with RSVPs |
| POST | /events/{id}/rsvp | Yes | RSVP or update RSVP status |

### Study Groups
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /study/requests | No | List open study requests |
| POST | /study/requests | Yes | Post a study request |
| GET | /study/groups | No | List active study groups |
| POST | /study/groups | Yes | Create a study group |
| GET | /study/groups/{id} | No | Get study group with member names |
| POST | /study/groups/{id}/join | Yes | Join a study group |
| DELETE | /study/groups/{id}/leave | Yes | Leave a study group |

## Running Tests

```bash
cd backend
go test ./internal/handlers/... -v
```

## Frontend Tests

### Unit Tests
- `frontend/src/app/app.spec.ts` - root app smoke tests
- `frontend/src/app/core/auth.interceptor.spec.ts` - auth header injection tests
- `frontend/src/app/core/role.guard.spec.ts` - role-based route guard tests
- `frontend/src/app/core/api/api.utils.spec.ts` - API utility tests
- `frontend/src/app/events/events-list/events-list.spec.ts` - RSVP flow tests
- `frontend/src/app/feed/feed.spec.ts` - feed, likes, comments, and composer tests

### Cypress Tests
- `frontend/cypress/e2e/spec.cy.ts` - register flow from the landing page through successful form submission
