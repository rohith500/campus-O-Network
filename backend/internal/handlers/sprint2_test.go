package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/internal/auth"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/models"
)

type mockDB struct {
	clubs       []*models.Club
	clubMembers []*models.ClubMember
	events      []*models.Event
	rsvps       []*models.RSVP
	studyReqs   []*models.StudyRequest
	studyGroups []*models.StudyGroup
	sgMembers   []*models.StudyGroupMember
	nextID      int
	shouldFail  bool
}

func newMockDB() *mockDB { return &mockDB{nextID: 1} }
func (m *mockDB) autoID() int { id := m.nextID; m.nextID++; return id }

func (m *mockDB) ListClubs() ([]*models.Club, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	return m.clubs, nil
}
func (m *mockDB) CreateClub(name, description string, createdBy int) (*models.Club, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	c := &models.Club{ID: m.autoID(), Name: name, Description: description, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.clubs = append(m.clubs, c)
	return c, nil
}
func (m *mockDB) GetClubByID(id int) (*models.Club, error) {
	for _, c := range m.clubs { if c.ID == id { return c, nil } }
	return nil, fmt.Errorf("club not found")
}
func (m *mockDB) GetClubMembers(clubID int) ([]*models.ClubMember, error) {
	var out []*models.ClubMember
	for _, cm := range m.clubMembers { if cm.ClubID == clubID { out = append(out, cm) } }
	return out, nil
}
func (m *mockDB) JoinClub(clubID, userID int, role string) error {
	if m.shouldFail { return fmt.Errorf("db error") }
	m.clubMembers = append(m.clubMembers, &models.ClubMember{ID: m.autoID(), ClubID: clubID, UserID: userID, Role: role, JoinedAt: time.Now()})
	return nil
}
func (m *mockDB) LeaveClub(clubID, userID int) error {
	if m.shouldFail { return fmt.Errorf("db error") }
	for i, cm := range m.clubMembers {
		if cm.ClubID == clubID && cm.UserID == userID {
			m.clubMembers = append(m.clubMembers[:i], m.clubMembers[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("membership not found")
}
func (m *mockDB) ListEvents(clubID int) ([]*models.Event, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	if clubID > 0 {
		var out []*models.Event
		for _, e := range m.events { if e.ClubID == clubID { out = append(out, e) } }
		return out, nil
	}
	return m.events, nil
}
func (m *mockDB) CreateEvent(clubID, creatorID int, title, description, location string, date time.Time, capacity int) (*models.Event, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	e := &models.Event{ID: m.autoID(), ClubID: clubID, CreatorID: creatorID, Title: title, Description: description, Location: location, Date: date, Capacity: capacity, CreatedAt: time.Now(), UpdatedAt: time.Now()}
	m.events = append(m.events, e)
	return e, nil
}
func (m *mockDB) GetEventByID(id int) (*models.Event, error) {
	for _, e := range m.events { if e.ID == id { return e, nil } }
	return nil, fmt.Errorf("event not found")
}
func (m *mockDB) RSVPEvent(eventID, userID int, status string) error {
	if m.shouldFail { return fmt.Errorf("db error") }
	m.rsvps = append(m.rsvps, &models.RSVP{ID: m.autoID(), EventID: eventID, UserID: userID, Status: status, CreatedAt: time.Now()})
	return nil
}
func (m *mockDB) GetRSVPs(eventID int) ([]*models.RSVP, error) {
	var out []*models.RSVP
	for _, rv := range m.rsvps { if rv.EventID == eventID { out = append(out, rv) } }
	return out, nil
}
func (m *mockDB) ListStudyRequests() ([]*models.StudyRequest, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	return m.studyReqs, nil
}
func (m *mockDB) CreateStudyRequest(userID int, course, topic, availability, skillLevel string) (*models.StudyRequest, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	sr := &models.StudyRequest{ID: m.autoID(), UserID: userID, Course: course, Topic: topic, Availability: availability, SkillLevel: skillLevel, Matched: false, CreatedAt: time.Now(), ExpiresAt: time.Now().Add(7 * 24 * time.Hour)}
	m.studyReqs = append(m.studyReqs, sr)
	return sr, nil
}
func (m *mockDB) ListStudyGroups() ([]*models.StudyGroup, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	return m.studyGroups, nil
}
func (m *mockDB) CreateStudyGroup(course, topic string, maxMembers int) (*models.StudyGroup, error) {
	if m.shouldFail { return nil, fmt.Errorf("db error") }
	sg := &models.StudyGroup{ID: m.autoID(), Course: course, Topic: topic, MaxMembers: maxMembers, CreatedAt: time.Now(), ExpiresAt: time.Now().Add(30 * 24 * time.Hour)}
	m.studyGroups = append(m.studyGroups, sg)
	return sg, nil
}
func (m *mockDB) GetStudyGroupByID(id int) (*models.StudyGroup, error) {
	for _, sg := range m.studyGroups { if sg.ID == id { return sg, nil } }
	return nil, fmt.Errorf("study group not found")
}
func (m *mockDB) JoinStudyGroup(groupID, userID int) error {
	if m.shouldFail { return fmt.Errorf("db error") }
	m.sgMembers = append(m.sgMembers, &models.StudyGroupMember{ID: m.autoID(), StudyGroupID: groupID, UserID: userID, JoinedAt: time.Now()})
	return nil
}
func (m *mockDB) GetStudyGroupMembers(groupID int) ([]*models.StudyGroupMember, error) {
	var out []*models.StudyGroupMember
	for _, m2 := range m.sgMembers { if m2.StudyGroupID == groupID { out = append(out, m2) } }
	return out, nil
}
func (m *mockDB) CreateUser(email, passwordHash, name, role string) (*models.User, error) { return nil, nil }
func (m *mockDB) GetUserByID(id int) (*models.User, error)                                { return nil, nil }
func (m *mockDB) GetUserByEmail(email string) (*models.User, error)                       { return nil, nil }
func (m *mockDB) UpdateUser(id int, name, role string) error                              { return nil }
func (m *mockDB) DeleteUser(id int) error                                                 { return nil }
func (m *mockDB) CreatePost(userID int, content, tags string) (*models.Post, error)       { return nil, nil }
func (m *mockDB) GetPostByID(id int) (*models.Post, error)                                { return nil, nil }
func (m *mockDB) GetAllPosts(limit, offset int) ([]*models.Post, error)                   { return nil, nil }
func (m *mockDB) UpdatePost(id int, content, tags string) error                           { return nil }
func (m *mockDB) DeletePost(id int) error                                                 { return nil }
func (m *mockDB) LikePost(id int) error                                                   { return nil }
func (m *mockDB) CreateStudent(name, email, major string, year int) (int64, error)        { return 0, nil }
func (m *mockDB) ListStudents() ([]db.StudentRow, error)                                  { return nil, nil }
func (m *mockDB) GetStudent(id int) (*db.StudentRow, error)                               { return nil, nil }
func (m *mockDB) UpdateStudent(id int, name, email, major string, year int) error         { return nil }
func (m *mockDB) DeleteStudent(id int) error                                              { return nil }

func authedReq(method, path string, body interface{}, userID int) *http.Request {
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	claims := &auth.JWTClaims{UserID: userID, Email: "test@ufl.edu", Role: "student"}
	ctx := context.WithValue(req.Context(), middleware.UserClaimsKey, claims)
	return req.WithContext(ctx)
}

// ── Club Tests ───────────────────────────────────────────────────────────────

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

// ── Event Tests ──────────────────────────────────────────────────────────────

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

// ── Study Group Tests ────────────────────────────────────────────────────────

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
