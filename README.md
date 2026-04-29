# Campus-O-Network

A campus social network for University of Florida students to connect through clubs, events, study groups, profiles, and a shared feed.

## Requirements

- Go 1.21+
- Node.js 18+
- npm 9+
- SQLite3

## Setup

1. Clone the repository and open the project root.
2. Start the backend so the API is available on `http://localhost:8079`.
3. Start the frontend so the app is available on `http://localhost:4200`.

## Running the Backend

```bash
cd backend
go run main.go
```

The backend serves the REST API and SQLite database-backed application state.

## Running the Frontend

```bash
cd frontend
npm install
npm start
```

The frontend opens in the browser at `http://localhost:4200`.

## First Time Use

1. Register a new student account at `http://localhost:4200/auth/register`.
2. Log in to receive a JWT-backed session.
3. Visit the feed to create posts, like posts, and comment on posts.
4. Use the profile page to save your bio, interests, availability, and skill level.
5. Browse clubs, events, and study groups from the navigation pages.

You can also register directly through the API:

```bash
curl -X POST http://localhost:8079/auth/register \
	-H "Content-Type: application/json" \
	-d '{"email":"you@ufl.edu","password":"pass","name":"Your Name"}'
```

## Running Backend Tests

```bash
cd backend
go test ./internal/handlers/... -v
```

82 backend handler tests cover auth, feed, clubs, events, study groups, profile, likes, and comments.

## Backend API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login returns JWT |
| GET | /feed | No | List posts with author names and timestamps |
| POST | /feed/create | Yes | Create a post |
| POST | /feed/{id}/like | Yes | Toggle like on a post |
| GET | /feed/{id}/comments | No | List comments with author names |
| POST | /feed/{id}/comments | Yes | Add a comment and return author name |
| DELETE | /feed/{id}/comments/{commentId} | Yes | Delete your comment |
| GET | /profile | Yes | Get your profile |
| PUT | /profile | Yes | Create or update profile |
| GET | /clubs | No | List all clubs |
| POST | /clubs | Yes | Create a club |
| GET | /clubs/{id} | No | Get club with members |
| POST | /clubs/{id}/join | Yes | Join a club |
| DELETE | /clubs/{id}/leave | Yes | Leave a club |
| GET | /events | No | List events |
| POST | /events | Yes | Create an event |
| GET | /events/{id} | No | Get event with RSVPs |
| POST | /events/{id}/rsvp | Yes | RSVP or update RSVP |
| GET | /study/requests | No | List study requests |
| POST | /study/requests | Yes | Post a study request |
| GET | /study/groups | No | List study groups |
| POST | /study/groups | Yes | Create a study group |
| GET | /study/groups/{id} | No | Get study group with members |
| POST | /study/groups/{id}/join | Yes | Join a study group |
| DELETE | /study/groups/{id}/leave | Yes | Leave a study group |
