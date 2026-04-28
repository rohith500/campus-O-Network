package handlers_test

import (
	"backend/internal/auth"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/models"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

type mockDB struct {
	users             []*models.User
	posts             []*models.Post
	clubs             []*models.Club
	clubMembers       []*models.ClubMember
	events            []*models.Event
	rsvps             []*models.RSVP
	studyReqs         []*models.StudyRequest
	studyGroups       []*models.StudyGroup
	sgMembers         []*models.StudyGroupMember
	profiles          []*models.UserProfile
	comments          []*models.Comment
	createUserErr     error
	getUserByEmailErr error
	createPostErr     error
	getAllPostsErr    error
	nextID            int
	shouldFail        bool
}

func newMockDB() *mockDB      { return &mockDB{nextID: 1} }
func (m *mockDB) autoID() int { id := m.nextID; m.nextID++; return id }

// ── Club methods ─────────────────────────────────────────────────────────────

func (m *mockDB) ListClubs() ([]*models.Club, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	return m.clubs, nil
}
func (m *mockDB) CreateClub(name, description string, createdBy int) (*models.Club, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	c := &models.Club{ID: m.autoID(), Name: name, Description: description, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.clubs = append(m.clubs, c)
	return c, nil
}
func (m *mockDB) GetClubByID(id int) (*models.Club, error) {
	for _, c := range m.clubs {
		if c.ID == id {
			return c, nil
		}
	}
	return nil, fmt.Errorf("club not found")
}
func (m *mockDB) GetClubMembers(clubID int) ([]*models.ClubMember, error) {
	var out []*models.ClubMember
	for _, cm := range m.clubMembers {
		if cm.ClubID == clubID {
			out = append(out, cm)
		}
	}
	return out, nil
}
func (m *mockDB) JoinClub(clubID, userID int, role string) error {
	if m.shouldFail {
		return fmt.Errorf("db error")
	}
	m.clubMembers = append(m.clubMembers, &models.ClubMember{ID: m.autoID(), ClubID: clubID, UserID: userID, Role: role, JoinedAt: time.Now()})
	return nil
}
func (m *mockDB) LeaveClub(clubID, userID int) error {
	if m.shouldFail {
		return fmt.Errorf("db error")
	}
	for i, cm := range m.clubMembers {
		if cm.ClubID == clubID && cm.UserID == userID {
			m.clubMembers = append(m.clubMembers[:i], m.clubMembers[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("membership not found")
}

// ── Event methods ─────────────────────────────────────────────────────────────

func (m *mockDB) ListEvents(clubID int) ([]*models.Event, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	if clubID > 0 {
		var out []*models.Event
		for _, e := range m.events {
			if e.ClubID == clubID {
				out = append(out, e)
			}
		}
		return out, nil
	}
	return m.events, nil
}
func (m *mockDB) CreateEvent(clubID, creatorID int, title, description, location string, date time.Time, capacity int) (*models.Event, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	e := &models.Event{ID: m.autoID(), ClubID: clubID, CreatorID: creatorID, Title: title, Description: description, Location: location, Date: date, Capacity: capacity, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.events = append(m.events, e)
	return e, nil
}
func (m *mockDB) GetEventByID(id int) (*models.Event, error) {
	for _, e := range m.events {
		if e.ID == id {
			return e, nil
		}
	}
	return nil, fmt.Errorf("event not found")
}
func (m *mockDB) RSVPEvent(eventID, userID int, status string) error {
	if m.shouldFail {
		return fmt.Errorf("db error")
	}
	m.rsvps = append(m.rsvps, &models.RSVP{ID: m.autoID(), EventID: eventID, UserID: userID, Status: status, CreatedAt: time.Now()})
	return nil
}
func (m *mockDB) GetRSVPs(eventID int) ([]*models.RSVP, error) {
	var out []*models.RSVP
	for _, rv := range m.rsvps {
		if rv.EventID == eventID {
			out = append(out, rv)
		}
	}
	return out, nil
}

// ── Study methods ─────────────────────────────────────────────────────────────

func (m *mockDB) ListStudyRequests() ([]*models.StudyRequest, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	return m.studyReqs, nil
}
func (m *mockDB) CreateStudyRequest(userID int, course, topic, availability, skillLevel string) (*models.StudyRequest, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	sr := &models.StudyRequest{ID: m.autoID(), UserID: userID, Course: course, Topic: topic, Availability: availability, SkillLevel: skillLevel, Matched: false, CreatedAt: time.Now(), ExpiresAt: time.Now().Add(7 * 24 * time.Hour)}
	m.studyReqs = append(m.studyReqs, sr)
	return sr, nil
}
func (m *mockDB) ListStudyGroups() ([]*models.StudyGroup, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	return m.studyGroups, nil
}
func (m *mockDB) CreateStudyGroup(course, topic string, maxMembers int) (*models.StudyGroup, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("db error")
	}
	sg := &models.StudyGroup{ID: m.autoID(), Course: course, Topic: topic, MaxMembers: maxMembers, CreatedAt: time.Now(), ExpiresAt: time.Now().Add(30 * 24 * time.Hour)}
	m.studyGroups = append(m.studyGroups, sg)
	return sg, nil
}
func (m *mockDB) GetStudyGroupByID(id int) (*models.StudyGroup, error) {
	for _, sg := range m.studyGroups {
		if sg.ID == id {
			return sg, nil
		}
	}
	return nil, fmt.Errorf("study group not found")
}
func (m *mockDB) JoinStudyGroup(groupID, userID int) error {
	if m.shouldFail {
		return fmt.Errorf("db error")
	}
	found := false
	for _, sg := range m.studyGroups {
		if sg.ID == groupID {
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("study group not found")
	}
	m.sgMembers = append(m.sgMembers, &models.StudyGroupMember{ID: m.autoID(), StudyGroupID: groupID, UserID: userID, JoinedAt: time.Now()})
	return nil
}
func (m *mockDB) GetStudyGroupMembers(groupID int) ([]*models.StudyGroupMember, error) {
	var out []*models.StudyGroupMember
	for _, m2 := range m.sgMembers {
		if m2.StudyGroupID == groupID {
			out = append(out, m2)
		}
	}
	return out, nil
}

// ── User methods ──────────────────────────────────────────────────────────────

func (m *mockDB) CreateUser(email, passwordHash, name, role string) (*models.User, error) {
	if m.createUserErr != nil {
		return nil, m.createUserErr
	}
	u := &models.User{ID: m.autoID(), Email: email, Password: passwordHash, Name: name, Role: role, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.users = append(m.users, u)
	return u, nil
}
func (m *mockDB) GetUserByID(id int) (*models.User, error) { return nil, nil }
func (m *mockDB) GetUserByEmail(email string) (*models.User, error) {
	if m.getUserByEmailErr != nil {
		return nil, m.getUserByEmailErr
	}
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}
func (m *mockDB) UpdateUser(id int, name, role string) error { return nil }
func (m *mockDB) DeleteUser(id int) error                    { return nil }

// ── Post methods ──────────────────────────────────────────────────────────────

func (m *mockDB) CreatePost(userID int, content, tags string) (*models.Post, error) {
	if m.createPostErr != nil {
		return nil, m.createPostErr
	}
	p := &models.Post{ID: m.autoID(), UserID: userID, Content: content, Tags: tags, Likes: 0, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.posts = append(m.posts, p)
	return p, nil
}
func (m *mockDB) GetPostByID(id int) (*models.Post, error) {
	for _, p := range m.posts {
		if p.ID == id {
			return p, nil
		}
	}
	return nil, fmt.Errorf("post not found")
}
func (m *mockDB) GetAllPosts(limit, offset int) ([]*models.Post, error) {
	if m.getAllPostsErr != nil {
		return nil, m.getAllPostsErr
	}
	if offset >= len(m.posts) {
		return []*models.Post{}, nil
	}
	end := offset + limit
	if end > len(m.posts) {
		end = len(m.posts)
	}
	return m.posts[offset:end], nil
}
func (m *mockDB) UpdatePost(id int, content, tags string) error { return nil }
func (m *mockDB) DeletePost(id int) error                       { return nil }
func (m *mockDB) LikePost(id int) error {
	for _, p := range m.posts {
		if p.ID == id {
			p.Likes++
			return nil
		}
	}
	return fmt.Errorf("post not found")
}

// ── Student methods ───────────────────────────────────────────────────────────

func (m *mockDB) CreateStudent(name, email, major string, year int) (int64, error) { return 0, nil }
func (m *mockDB) ListStudents() ([]db.StudentRow, error)                           { return nil, nil }
func (m *mockDB) GetStudent(id int) (*db.StudentRow, error)                        { return nil, nil }
func (m *mockDB) UpdateStudent(id int, name, email, major string, year int) error  { return nil }
func (m *mockDB) DeleteStudent(id int) error                                       { return nil }

// ── Profile methods (Sprint 3) ────────────────────────────────────────────────

func (m *mockDB) GetProfileByUserID(userID int) (*models.UserProfile, error) {
	for _, p := range m.profiles {
		if p.UserID == userID {
			return p, nil
		}
	}
	return nil, fmt.Errorf("profile not found")
}
func (m *mockDB) UpsertProfile(userID int, bio, interests, availability, skillLevel string) (*models.UserProfile, error) {
	for _, p := range m.profiles {
		if p.UserID == userID {
			p.Bio = bio
			p.Interests = interests
			p.Availability = availability
			p.SkillLevel = skillLevel
			p.UpdatedAt = time.Now()
			return p, nil
		}
	}
	p := &models.UserProfile{ID: m.autoID(), UserID: userID, Bio: bio, Interests: interests, Availability: availability, SkillLevel: skillLevel, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.profiles = append(m.profiles, p)
	return p, nil
}

// ── Comment methods (Sprint 3) ────────────────────────────────────────────────

func (m *mockDB) CreateComment(postID, userID int, content string) (*models.Comment, error) {
	c := &models.Comment{ID: m.autoID(), PostID: postID, UserID: userID, Content: content, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.comments = append(m.comments, c)
	return c, nil
}
func (m *mockDB) GetCommentByID(id int) (*models.Comment, error) {
	for _, c := range m.comments {
		if c.ID == id {
			return c, nil
		}
	}
	return nil, fmt.Errorf("comment not found")
}
func (m *mockDB) GetCommentsByPostID(postID int) ([]*models.Comment, error) {
	var out []*models.Comment
	for _, c := range m.comments {
		if c.PostID == postID {
			out = append(out, c)
		}
	}
	return out, nil
}
func (m *mockDB) DeleteComment(commentID, userID int) error {
	for i, c := range m.comments {
		if c.ID == commentID && c.UserID == userID {
			m.comments = append(m.comments[:i], m.comments[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("comment not found or not owned by user")
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func authedReq(method, path string, body interface{}, userID int) *http.Request {
	return authedReqWithRole(method, path, body, userID, "student")
}

func authedReqWithRole(method, path string, body interface{}, userID int, role string) *http.Request {
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	claims := &auth.JWTClaims{UserID: userID, Email: "test@ufl.edu", Role: role}
	ctx := context.WithValue(req.Context(), middleware.UserClaimsKey, claims)
	return req.WithContext(ctx)
}

func newHandlerWithMock() *handlers.Handler {
	return handlers.New(newMockDB())
}
func newHandlerWith(mdb *mockDB) *handlers.Handler {
	return handlers.New(mdb)
}

// ── Auth Tests ────────────────────────────────────────────────────────────────

func TestRegister_MethodNotAllowed(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/auth/register", nil)
	rr := httptest.NewRecorder()
	h.Register(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}
func TestRegister_MissingFields(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString(`{"email":"a@ufl.edu","password":"secret123"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.Register(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestRegister_DBError(t *testing.T) {
	mdb := newMockDB()
	mdb.createUserErr = fmt.Errorf("insert failed")
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString(`{"email":"a@ufl.edu","password":"secret123","name":"Alice"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.Register(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestRegister_Success(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString(`{"email":"alice@ufl.edu","password":"secret123","name":"Alice"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.Register(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("expected json body: %v", err)
	}
	if resp["token"] == "" || resp["token"] == nil {
		t.Fatalf("expected token in response")
	}
}
func TestLogin_MethodNotAllowed(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/auth/login", nil)
	rr := httptest.NewRecorder()
	h.Login(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}
func TestLogin_MissingFields(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(`{"email":"alice@ufl.edu"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.Login(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestLogin_UserNotFound(t *testing.T) {
	mdb := newMockDB()
	mdb.getUserByEmailErr = fmt.Errorf("not found")
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(`{"email":"missing@ufl.edu","password":"secret123"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.Login(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
func TestLogin_WrongPassword(t *testing.T) {
	hash, err := auth.HashPassword("right-password")
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	mdb := newMockDB()
	mdb.users = append(mdb.users, &models.User{ID: 1, Email: "alice@ufl.edu", Password: hash, Name: "Alice", Role: "student"})
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(`{"email":"alice@ufl.edu","password":"wrong-password"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.Login(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
func TestLogin_Success(t *testing.T) {
	hash, err := auth.HashPassword("right-password")
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	mdb := newMockDB()
	mdb.users = append(mdb.users, &models.User{ID: 1, Email: "alice@ufl.edu", Password: hash, Name: "Alice", Role: "student"})
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(`{"email":"alice@ufl.edu","password":"right-password"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.Login(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("expected json body: %v", err)
	}
	if resp["token"] == "" || resp["token"] == nil {
		t.Fatalf("expected token in response")
	}
}

// ── Feed Tests ────────────────────────────────────────────────────────────────

func TestGetFeed_MethodNotAllowed(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/feed", nil)
	rr := httptest.NewRecorder()
	h.GetFeed(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}
func TestGetFeed_Empty(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/feed", nil)
	rr := httptest.NewRecorder()
	h.GetFeed(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
func TestGetFeed_WithPosts(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts,
		&models.Post{ID: 1, UserID: 1, Content: "First post", Tags: "go"},
		&models.Post{ID: 2, UserID: 2, Content: "Second post", Tags: "uf"},
	)
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodGet, "/feed?limit=10&offset=0", nil)
	rr := httptest.NewRecorder()
	h.GetFeed(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
func TestCreatePost_Unauthorized(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/feed/create", bytes.NewBufferString(`{"content":"hello"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreatePost(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
func TestCreatePost_MissingContent(t *testing.T) {
	h := handlers.New(newMockDB())
	req := authedReq(http.MethodPost, "/feed/create", map[string]string{"content": "   "}, 1)
	rr := httptest.NewRecorder()
	h.CreatePost(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestCreatePost_Success(t *testing.T) {
	h := handlers.New(newMockDB())
	req := authedReq(http.MethodPost, "/feed/create", map[string]string{"content": "Hello UF", "tags": "announcement"}, 1)
	rr := httptest.NewRecorder()
	h.CreatePost(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestStudents_CreateStudent_ForbiddenForNonAdmin(t *testing.T) {
	h := handlers.New(newMockDB())
	req := authedReq(http.MethodPost, "/students", map[string]interface{}{
		"name":  "Alice",
		"email": "alice@ufl.edu",
		"major": "CS",
		"year":  2,
	}, 1)
	rr := httptest.NewRecorder()

	h.Students(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

// ── Club Tests ────────────────────────────────────────────────────────────────

func TestListClubs_Empty(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/clubs", nil)
	rr := httptest.NewRecorder()
	h.ListClubs(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
func TestListClubs_MethodNotAllowed(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/clubs", nil)
	rr := httptest.NewRecorder()
	h.ListClubs(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}
func TestCreateClub_Success(t *testing.T) {
	h := handlers.New(newMockDB())
	req := authedReq(http.MethodPost, "/clubs", map[string]string{"name": "Go Club", "description": "We love Go"}, 1)
	rr := httptest.NewRecorder()
	h.CreateClub(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestCreateClub_MissingName(t *testing.T) {
	h := handlers.New(newMockDB())
	req := authedReq(http.MethodPost, "/clubs", map[string]string{"description": "no name"}, 1)
	rr := httptest.NewRecorder()
	h.CreateClub(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestCreateClub_Unauthorized(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/clubs", bytes.NewBufferString(`{"name":"x"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateClub(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
func TestGetClub_NotFound(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/clubs/99", nil)
	rr := httptest.NewRecorder()
	h.GetClub(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}
func TestJoinClub_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.clubs = append(mdb.clubs, &models.Club{ID: 1, Name: "Test Club"})
	h := handlers.New(mdb)
	req := authedReq(http.MethodPost, "/clubs/1/join", map[string]string{"role": "member"}, 2)
	req.URL.Path = "/clubs/1/join"
	rr := httptest.NewRecorder()
	h.JoinClub(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestLeaveClub_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.clubs = append(mdb.clubs, &models.Club{ID: 1, Name: "Test Club"})
	mdb.clubMembers = append(mdb.clubMembers, &models.ClubMember{ID: 1, ClubID: 1, UserID: 2, Role: "member"})
	h := handlers.New(mdb)
	req := authedReq(http.MethodDelete, "/clubs/1/leave", nil, 2)
	req.URL.Path = "/clubs/1/leave"
	rr := httptest.NewRecorder()
	h.LeaveClub(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestGetClub_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.clubs = append(mdb.clubs, &models.Club{ID: 1, Name: "Go Club"})
	mdb.clubMembers = append(mdb.clubMembers, &models.ClubMember{ID: 1, ClubID: 1, UserID: 2, Role: "member"})
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodGet, "/clubs/1", nil)
	rr := httptest.NewRecorder()
	h.GetClub(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestListClubs_WithData(t *testing.T) {
	mdb := newMockDB()
	mdb.clubs = append(mdb.clubs, &models.Club{ID: 1, Name: "Go Club"}, &models.Club{ID: 2, Name: "AI Club"})
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodGet, "/clubs", nil)
	rr := httptest.NewRecorder()
	h.ListClubs(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	var body struct {
		OK    bool          `json:"ok"`
		Clubs []models.Club `json:"clubs"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("expected json body: %v", err)
	}
	if len(body.Clubs) != 2 {
		t.Fatalf("expected 2 clubs, got %d", len(body.Clubs))
	}
}
func TestLeaveClub_NotMember(t *testing.T) {
	mdb := newMockDB()
	mdb.clubs = append(mdb.clubs, &models.Club{ID: 1, Name: "Go Club"})
	h := handlers.New(mdb)
	req := authedReq(http.MethodDelete, "/clubs/1/leave", nil, 99)
	req.URL.Path = "/clubs/1/leave"
	rr := httptest.NewRecorder()
	h.LeaveClub(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// ── Event Tests ───────────────────────────────────────────────────────────────

func TestListEvents_Empty(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	rr := httptest.NewRecorder()
	h.ListEvents(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
func TestCreateEvent_Success(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]interface{}{
		"title":    "UF Hackathon",
		"date":     time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		"capacity": 200,
	}
	req := authedReq(http.MethodPost, "/events", body, 1)
	rr := httptest.NewRecorder()
	h.CreateEvent(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestCreateEvent_MissingTitle(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]interface{}{"date": time.Now().Add(24 * time.Hour).Format(time.RFC3339)}
	req := authedReq(http.MethodPost, "/events", body, 1)
	rr := httptest.NewRecorder()
	h.CreateEvent(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestCreateEvent_InvalidDate(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]interface{}{"title": "Bad Event", "date": "not-a-date"}
	req := authedReq(http.MethodPost, "/events", body, 1)
	rr := httptest.NewRecorder()
	h.CreateEvent(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestGetEvent_NotFound(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/events/99", nil)
	rr := httptest.NewRecorder()
	h.GetEvent(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}
func TestGetEvent_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.events = append(mdb.events, &models.Event{ID: 1, Title: "Hackathon", ClubID: 10, Date: time.Now().Add(24 * time.Hour)})
	mdb.rsvps = append(mdb.rsvps, &models.RSVP{ID: 1, EventID: 1, UserID: 2, Status: "going"})
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodGet, "/events/1", nil)
	rr := httptest.NewRecorder()
	h.GetEvent(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestListEvents_FilterByClub(t *testing.T) {
	mdb := newMockDB()
	mdb.events = append(mdb.events,
		&models.Event{ID: 1, ClubID: 1, Title: "Club 1 Event"},
		&models.Event{ID: 2, ClubID: 2, Title: "Club 2 Event"},
	)
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodGet, "/events?club_id=1", nil)
	rr := httptest.NewRecorder()
	h.ListEvents(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	var body struct {
		OK     bool           `json:"ok"`
		Events []models.Event `json:"events"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("expected json body: %v", err)
	}
	if len(body.Events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(body.Events))
	}
}
func TestRSVPEvent_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.events = append(mdb.events, &models.Event{ID: 1, Title: "Hackathon", Date: time.Now().Add(24 * time.Hour)})
	h := handlers.New(mdb)
	req := authedReq(http.MethodPost, "/events/1/rsvp", map[string]string{"status": "going"}, 2)
	req.URL.Path = "/events/1/rsvp"
	rr := httptest.NewRecorder()
	h.RSVPEvent(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestRSVPEvent_InvalidStatus(t *testing.T) {
	mdb := newMockDB()
	mdb.events = append(mdb.events, &models.Event{ID: 1, Title: "Hackathon"})
	h := handlers.New(mdb)
	req := authedReq(http.MethodPost, "/events/1/rsvp", map[string]string{"status": "yes_please"}, 2)
	req.URL.Path = "/events/1/rsvp"
	rr := httptest.NewRecorder()
	h.RSVPEvent(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestRSVPEvent_Unauthorized(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/events/1/rsvp", bytes.NewBufferString(`{"status":"going"}`))
	req.Header.Set("Content-Type", "application/json")
	req.URL.Path = "/events/1/rsvp"
	rr := httptest.NewRecorder()
	h.RSVPEvent(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

// ── Study Group Tests ─────────────────────────────────────────────────────────

func TestListStudyRequests_Empty(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/study/requests", nil)
	rr := httptest.NewRecorder()
	h.ListStudyRequests(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
func TestCreateStudyRequest_Success(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]string{"course": "COP4600", "topic": "Memory Management", "availability": "weekends", "skillLevel": "intermediate"}
	req := authedReq(http.MethodPost, "/study/requests", body, 1)
	rr := httptest.NewRecorder()
	h.CreateStudyRequest(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestCreateStudyRequest_MissingTopic(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]string{"course": "COP4600"}
	req := authedReq(http.MethodPost, "/study/requests", body, 1)
	rr := httptest.NewRecorder()
	h.CreateStudyRequest(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestCreateStudyRequest_MissingCourse(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]string{"course": "   ", "topic": "Graphs"}
	req := authedReq(http.MethodPost, "/study/requests", body, 1)
	rr := httptest.NewRecorder()
	h.CreateStudyRequest(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
func TestListStudyGroups_Empty(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodGet, "/study/groups", nil)
	rr := httptest.NewRecorder()
	h.ListStudyGroups(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
func TestCreateStudyGroup_Success(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]interface{}{"course": "CAP5771", "topic": "Neural Networks", "maxMembers": 4}
	req := authedReq(http.MethodPost, "/study/groups", body, 1)
	rr := httptest.NewRecorder()
	h.CreateStudyGroup(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestCreateStudyGroup_DefaultMaxMembers(t *testing.T) {
	h := handlers.New(newMockDB())
	body := map[string]interface{}{"course": "CAP5771", "topic": "Decision Trees"}
	req := authedReq(http.MethodPost, "/study/groups", body, 1)
	rr := httptest.NewRecorder()
	h.CreateStudyGroup(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}
}
func TestListStudyGroups_WithData(t *testing.T) {
	mdb := newMockDB()
	mdb.studyGroups = append(mdb.studyGroups,
		&models.StudyGroup{ID: 1, Course: "CAP5771", Topic: "Neural Networks", MaxMembers: 5},
		&models.StudyGroup{ID: 2, Course: "COP4600", Topic: "OS", MaxMembers: 4},
	)
	h := handlers.New(mdb)
	req := httptest.NewRequest(http.MethodGet, "/study/groups", nil)
	rr := httptest.NewRecorder()
	h.ListStudyGroups(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	var body struct {
		OK     bool                `json:"ok"`
		Groups []models.StudyGroup `json:"groups"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("expected json body: %v", err)
	}
	if len(body.Groups) != 2 {
		t.Fatalf("expected 2 groups, got %d", len(body.Groups))
	}
}
func TestJoinStudyGroup_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.studyGroups = append(mdb.studyGroups, &models.StudyGroup{ID: 1, Course: "CAP5771", Topic: "NNs", MaxMembers: 5, ExpiresAt: time.Now().Add(30 * 24 * time.Hour)})
	h := handlers.New(mdb)
	req := authedReq(http.MethodPost, "/study/groups/1/join", nil, 2)
	req.URL.Path = "/study/groups/1/join"
	rr := httptest.NewRecorder()
	h.JoinStudyGroup(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}
func TestJoinStudyGroup_Unauthorized(t *testing.T) {
	h := handlers.New(newMockDB())
	req := httptest.NewRequest(http.MethodPost, "/study/groups/1/join", nil)
	req.URL.Path = "/study/groups/1/join"
	rr := httptest.NewRecorder()
	h.JoinStudyGroup(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
func TestJoinStudyGroup_NotFound(t *testing.T) {
	h := handlers.New(newMockDB())
	req := authedReq(http.MethodPost, "/study/groups/999/join", nil, 2)
	req.URL.Path = "/study/groups/999/join"
	rr := httptest.NewRecorder()
	h.JoinStudyGroup(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// ── Sprint 4 mock methods ─────────────────────────────────────────────────────

func (m *mockDB) HasLiked(postID, userID int) (bool, error) {
	return false, nil
}

func (m *mockDB) ToggleLike(postID, userID int) (bool, error) {
	for _, p := range m.posts {
		if p.ID == postID {
			p.Likes++
			return true, nil
		}
	}
	return false, fmt.Errorf("post not found")
}

func (m *mockDB) LeaveStudyGroup(groupID, userID int) error {
	for i, m2 := range m.sgMembers {
		if m2.StudyGroupID == groupID && m2.UserID == userID {
			m.sgMembers = append(m.sgMembers[:i], m.sgMembers[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("not a member")
}
