# Sprint 1 Report – Campus-O-Network
Team Members

### Backend Team

Nitin Avula - 12255254

Rohith Reddy Nama - 69965665

### Frontend Team

Yash Chaudhari - 22603734

Ashmit Sharma - 28381009
## FRONTEND: 

### Sprint 1 User Stories
https://github.com/users/rohith500/projects/3/views/2


1. Create a landing page - As an user i should be able to view the features of the website
2. Create a sign in / register page - As an user I should be able to sign in / register for thsi website
3. Create a feed page - As an user i should be able to view my feed of posts and upcoming events
4. Setup angular project
5. Add a page to search for student clubs - As an user i should be able to search for existing clubs
6. Add a superadmin page - As a moderator I should be able to approve student club creation/ posts
7. Create a posts page - An user should be able to view the comments on a specific post.
8. Like posts - An user should be able to like the posts posted on the website
9. Comment to posts - An user should be able to comment on the posts posted on the website
10. Student clubs page - A page to browse all the existing student clubs
11. Post type - events - An user should be able to post an event which will show up as an upcoming event in the feed
12. Post type - polls - An user should be able to post polls on the website.

### Issues Planned for Sprint 1

Setup angular project

Create a landing page - As an user i should be able to view the features of the website

Create a sign in / register page - As an user I should be able to sign in 

Create a feed page - As an user i should be able to view my feed of posts and upcoming events

Integration with mock server - generate mock api endpoints using faker.js

Add a superadmin page - As a moderator I should be able to approve student club creation/ posts

Add a page to search for student clubs - As an user i should be able to search for existing clubs


### Successfully Completed

Frontend successfully runs 

Setup a mock server with angular proxy

Created landing page

Created Signin and register pages with input validation

Integrated with mock server

Created mock api endpoints with faker.js syntax

Created a feed page

Added auth guards for feed page

Frontend demo video recorded

### Not Completed in Sprint 1 and Reasons
Superadmin page
We first need to integrate it with the real backend so we can keep track of approved organizations

Search page for student clubs
We need to integrate with the backend first so we will prioritize this in the next sprint.

### Sprint 1 Summary

Sprint 1 focused on setting up the angular pages with basic landing and sign up / login pages. We will focus on building the post related pages in the next sprint with focus on integrating with the actual backend.

## BACKEND: 

### Sprint 1 User Stories

1.As a student, I want to register and log in securely so that I can access protected campus features.
2.As a student, I want to view a public campus feed so I can discover updates and activities.
3.As a logged-in user, I want to create feed posts so I can share information with others.
4.As a team admin or developer, I want health-check and basic student CRUD APIs to validate backend functionality quickly.
5.As a new user, I want a simple frontend (landing, login, register) to onboard into the platform.

### Issues Planned for Sprint 1

Backend setup and modular project structure in Go
SQLite database setup with migrations for users, profiles, feed posts, clubs, club members, and students

Authentication APIs:
/auth/register
/auth/login
JWT-based token generation and validation
Public feed listing API (/feed) with pagination
Protected feed creation API (/feed/create)
Protected student CRUD APIs (/students, /students/{id})

Health-check API (/health)
Frontend pages for landing, login, and register
### Successfully Completed

Backend service runs successfully and is testable via curl and Postman
User registration and login implemented using bcrypt password hashing and JWT authentication
Public feed listing endpoint implemented with pagination support
Auth-protected feed post creation implemented
Auth-protected student CRUD operations implemented (create, list, retrieve by ID, update, delete)
Health endpoint implemented for service validation
Initial frontend onboarding screens for landing, login, and register completed

Backend demo video recorded

### Not Completed in Sprint 1 and Reasons

Full club discovery and management APIs
Reason: The database schema and migrations were prepared, but the API layer was deferred to prioritize authentication and core feed functionality.

Real-time group chat and WebSocket integration
Reason: Requires additional socket architecture, room management, and end-to-end testing, which exceeded the Sprint 1 timeline.

Study-group matching workflows and scheduling flows
Reason: Dependent on finalized UI flows and matching logic; deferred to the next sprint.

Moderation, reporting, and audit features
Reason: Lower priority compared to delivering secure authentication and core feed functionality.

### Sprint 1 Summary

Sprint 1 focused on building a stable backend foundation and delivering core authentication and feed capabilities. The team successfully implemented secure login, JWT-based authorization, feed management, and student CRUD APIs. Foundational frontend onboarding pages were also completed. Advanced collaboration and moderation features have been scheduled for Sprint 2.
