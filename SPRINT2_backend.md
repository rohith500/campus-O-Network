# Sprint 2 – Campus-O-Network

## Team Members
- Nitin Avula – 12255254
- Rohith Reddy Nama – 69965665

## Work Completed in Sprint 2

### Backend (Nitin Avula)
- Clubs API: list, create, get, join, leave (`/clubs`, `/clubs/{id}`, `/clubs/{id}/join`, `/clubs/{id}/leave`)
- Events API: list, create, get, RSVP (`/events`, `/events/{id}`, `/events/{id}/rsvp`)
- Study Groups API: study requests + groups (`/study/requests`, `/study/groups`, `/study/groups/{id}/join`)
- Added 7 new SQLite tables via migrations
- Extracted `db.Database` interface for testability
- 23 unit tests passing (`go test ./internal/handlers/... -v`)

## Backend Unit Tests

| Test | Result |
|---|---|
| TestListClubs_Empty | PASS |
| TestListClubs_MethodNotAllowed | PASS |
| TestCreateClub_Success | PASS |
| TestCreateClub_MissingName | PASS |
| TestCreateClub_Unauthorized | PASS |
| TestGetClub_NotFound | PASS |
| TestJoinClub_Success | PASS |
| TestLeaveClub_Success | PASS |
| TestListEvents_Empty | PASS |
| TestCreateEvent_Success | PASS |
| TestCreateEvent_MissingTitle | PASS |
| TestCreateEvent_InvalidDate | PASS |
| TestGetEvent_NotFound | PASS |
| TestRSVPEvent_Success | PASS |
| TestRSVPEvent_InvalidStatus | PASS |
| TestListStudyRequests_Empty | PASS |
| TestCreateStudyRequest_Success | PASS |
| TestCreateStudyRequest_MissingTopic | PASS |
| TestListStudyGroups_Empty | PASS |
| TestCreateStudyGroup_Success | PASS |
| TestCreateStudyGroup_DefaultMaxMembers | PASS |
| TestJoinStudyGroup_Success | PASS |
| TestJoinStudyGroup_Unauthorized | PASS |

## Backend API Documentation

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
