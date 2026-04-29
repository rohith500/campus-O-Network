package handlers_test

import (
	"backend/internal/models"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// ── Toggle Like Tests ─────────────────────────────────────────────────────────

func TestToggleLike_LikeSuccess(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, UserID: 2, Content: "Hello", Likes: 0})
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodPost, "/feed/1/like", nil, 3)
	req.URL.Path = "/feed/1/like"
	rr := httptest.NewRecorder()
	h.LikePost(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestToggleLike_Unauthorized(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	h := newHandlerWith(mdb)
	req := httptest.NewRequest(http.MethodPost, "/feed/1/like", nil)
	req.URL.Path = "/feed/1/like"
	rr := httptest.NewRecorder()
	h.LikePost(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestToggleLike_MethodNotAllowed(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodGet, "/feed/1/like", nil, 1)
	req.URL.Path = "/feed/1/like"
	rr := httptest.NewRecorder()
	h.LikePost(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestToggleLike_PostNotFound(t *testing.T) {
	h := newHandlerWithMock()
	req := authedReq(http.MethodPost, "/feed/99/like", nil, 1)
	req.URL.Path = "/feed/99/like"
	rr := httptest.NewRecorder()
	h.LikePost(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// ── Leave Study Group Tests ───────────────────────────────────────────────────

func TestLeaveStudyGroup_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.studyGroups = append(mdb.studyGroups, &models.StudyGroup{ID: 1, Course: "COP4600", Topic: "OS", MaxMembers: 5, ExpiresAt: time.Now().Add(30 * 24 * time.Hour)})
	mdb.sgMembers = append(mdb.sgMembers, &models.StudyGroupMember{ID: 1, StudyGroupID: 1, UserID: 2})
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodDelete, "/study/groups/1/leave", nil, 2)
	req.URL.Path = "/study/groups/1/leave"
	rr := httptest.NewRecorder()
	h.LeaveStudyGroup(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestLeaveStudyGroup_Unauthorized(t *testing.T) {
	h := newHandlerWithMock()
	req := httptest.NewRequest(http.MethodDelete, "/study/groups/1/leave", nil)
	req.URL.Path = "/study/groups/1/leave"
	rr := httptest.NewRecorder()
	h.LeaveStudyGroup(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestLeaveStudyGroup_MethodNotAllowed(t *testing.T) {
	h := newHandlerWithMock()
	req := authedReq(http.MethodPost, "/study/groups/1/leave", nil, 1)
	req.URL.Path = "/study/groups/1/leave"
	rr := httptest.NewRecorder()
	h.LeaveStudyGroup(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestLeaveStudyGroup_NotMember(t *testing.T) {
	mdb := newMockDB()
	mdb.studyGroups = append(mdb.studyGroups, &models.StudyGroup{ID: 1, Course: "COP4600", Topic: "OS", MaxMembers: 5})
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodDelete, "/study/groups/1/leave", nil, 99)
	req.URL.Path = "/study/groups/1/leave"
	rr := httptest.NewRecorder()
	h.LeaveStudyGroup(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// ── GetStudyGroup Tests ───────────────────────────────────────────────────────

func TestGetStudyGroup_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.studyGroups = append(mdb.studyGroups, &models.StudyGroup{ID: 1, Course: "CAP5771", Topic: "ML", MaxMembers: 4})
	h := newHandlerWith(mdb)
	req := httptest.NewRequest(http.MethodGet, "/study/groups/1", nil)
	req.URL.Path = "/study/groups/1"
	rr := httptest.NewRecorder()
	h.GetStudyGroup(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestGetStudyGroup_NotFound(t *testing.T) {
	h := newHandlerWithMock()
	req := httptest.NewRequest(http.MethodGet, "/study/groups/999", nil)
	req.URL.Path = "/study/groups/999"
	rr := httptest.NewRecorder()
	h.GetStudyGroup(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}

func TestGetStudyGroup_MethodNotAllowed(t *testing.T) {
	h := newHandlerWithMock()
	req := authedReq(http.MethodPost, "/study/groups/1", nil, 1)
	req.URL.Path = "/study/groups/1"
	rr := httptest.NewRecorder()
	h.GetStudyGroup(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestGetStudyGroup_MemberLookupError(t *testing.T) {
	mdb := newMockDB()
	mdb.studyGroups = append(mdb.studyGroups, &models.StudyGroup{ID: 1, Course: "CAP5771", Topic: "ML", MaxMembers: 4})
	mdb.getStudyGroupMembersErr = fmt.Errorf("member lookup failed")
	h := newHandlerWith(mdb)
	req := httptest.NewRequest(http.MethodGet, "/study/groups/1", nil)
	req.URL.Path = "/study/groups/1"
	rr := httptest.NewRecorder()
	h.GetStudyGroup(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestJoinStudyGroup_MemberLookupError(t *testing.T) {
	mdb := newMockDB()
	mdb.studyGroups = append(mdb.studyGroups, &models.StudyGroup{ID: 1, Course: "CAP5771", Topic: "ML", MaxMembers: 4})
	mdb.getStudyGroupMembersErr = fmt.Errorf("member lookup failed")
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodPost, "/study/groups/1/join", nil, 2)
	req.URL.Path = "/study/groups/1/join"
	rr := httptest.NewRecorder()
	h.JoinStudyGroup(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d: %s", rr.Code, rr.Body.String())
	}
}
