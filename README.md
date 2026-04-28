# Campus-O-Network

A campus social network for University of Florida students to connect through clubs, events, study groups, and a shared feed.

## Requirements

- Go 1.21+
- Node.js 18+
- npm 9+
- SQLite3

## Running the Backend

cd backend && go run main.go

API starts on http://localhost:8079

## Running the Frontend

cd frontend && npm install && npm start

App opens at http://localhost:4200

## First Time Setup

Register at http://localhost:4200/auth/register

Or via API:
curl -X POST http://localhost:8079/auth/register -H "Content-Type: application/json" -d '{"email":"you@ufl.edu","password":"pass","name":"Your Name"}'

## Running Backend Tests

cd backend && go test ./internal/handlers/... -v

78 tests covering auth, feed, clubs, events, study groups, profile, likes, and comments.

## Backend API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login returns JWT |
| GET | /feed | No | List posts with author names and timestamps |
| POST | /feed/create | Yes | Create a post |
| POST | /feed/{id}/like | Yes | Toggle like on a post |
| GET | /feed/{id}/comments | No | List comments |
| POST | /feed/{id}/comments | Yes | Add a comment |
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
