package handlers_test

import (
	"backend/internal/models"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// ── Profile Tests ─────────────────────────────────────────────────────────────

func TestGetProfile_NoProfile(t *testing.T) {
	h := newHandlerWithMock()
	req := authedReq(http.MethodGet, "/profile", nil, 1)
	rr := httptest.NewRecorder()
	h.GetProfile(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestGetProfile_Unauthorized(t *testing.T) {
	h := newHandlerWithMock()
	req := httptest.NewRequest(http.MethodGet, "/profile", nil)
	rr := httptest.NewRecorder()
	h.GetProfile(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestGetProfile_MethodNotAllowed(t *testing.T) {
	h := newHandlerWithMock()
	req := authedReq(http.MethodPost, "/profile", nil, 1)
	rr := httptest.NewRecorder()
	h.GetProfile(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestUpdateProfile_Success(t *testing.T) {
	h := newHandlerWithMock()
	body := map[string]string{
		"bio":          "CS grad student at UF",
		"interests":    "Go, distributed systems",
		"availability": "weekends",
		"skillLevel":   "advanced",
	}
	req := authedReq(http.MethodPut, "/profile", body, 1)
	rr := httptest.NewRecorder()
	h.UpdateProfile(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUpdateProfile_Unauthorized(t *testing.T) {
	h := newHandlerWithMock()
	req := httptest.NewRequest(http.MethodPut, "/profile", strings.NewReader(`{"bio":"test"}`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.UpdateProfile(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestUpdateProfile_MethodNotAllowed(t *testing.T) {
	h := newHandlerWithMock()
	req := authedReq(http.MethodPost, "/profile", map[string]string{"bio": "test"}, 1)
	rr := httptest.NewRecorder()
	h.UpdateProfile(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestGetProfile_AfterUpdate(t *testing.T) {
	mdb := newMockDB()
	h := newHandlerWith(mdb)

	updateReq := authedReq(http.MethodPut, "/profile", map[string]string{
		"bio":       "Backend dev",
		"interests": "Go",
	}, 1)
	updateRR := httptest.NewRecorder()
	h.UpdateProfile(updateRR, updateReq)
	if updateRR.Code != http.StatusOK {
		t.Fatalf("update failed: %d: %s", updateRR.Code, updateRR.Body.String())
	}

	getReq := authedReq(http.MethodGet, "/profile", nil, 1)
	getRR := httptest.NewRecorder()
	h.GetProfile(getRR, getReq)
	if getRR.Code != http.StatusOK {
		t.Fatalf("get failed: %d: %s", getRR.Code, getRR.Body.String())
	}
}

func TestGetProfile_DatabaseError(t *testing.T) {
	mdb := newMockDB()
	mdb.getProfileErr = fmt.Errorf("db failure")
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodGet, "/profile", nil, 1)
	rr := httptest.NewRecorder()
	h.GetProfile(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d: %s", rr.Code, rr.Body.String())
	}
}

// ── Like Tests ────────────────────────────────────────────────────────────────

func TestLikePost_Success(t *testing.T) {
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

func TestLikePost_Unauthorized(t *testing.T) {
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

func TestLikePost_MethodNotAllowed(t *testing.T) {
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

func TestLikePost_PostNotFound(t *testing.T) {
	h := newHandlerWithMock()
	req := authedReq(http.MethodPost, "/feed/99/like", nil, 1)
	req.URL.Path = "/feed/99/like"
	rr := httptest.NewRecorder()
	h.LikePost(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// ── Comment Tests ─────────────────────────────────────────────────────────────

func TestGetComments_Empty(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	h := newHandlerWith(mdb)
	req := httptest.NewRequest(http.MethodGet, "/feed/1/comments", nil)
	req.URL.Path = "/feed/1/comments"
	rr := httptest.NewRecorder()
	h.GetComments(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestGetComments_MethodNotAllowed(t *testing.T) {
	h := newHandlerWithMock()
	req := httptest.NewRequest(http.MethodPut, "/feed/1/comments", nil)
	req.URL.Path = "/feed/1/comments"
	rr := httptest.NewRecorder()
	h.GetComments(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestCreateComment_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.users = append(mdb.users, &models.User{ID: 2, Email: "alice@ufl.edu", Name: "Alice", Role: "student"})
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodPost, "/feed/1/comments", map[string]string{"content": "Great post!"}, 2)
	req.URL.Path = "/feed/1/comments"
	rr := httptest.NewRecorder()
	h.CreateComment(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("expected json body: %v", err)
	}
	comment, ok := resp["comment"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected comment object in response")
	}
	if comment["AuthorName"] != "Alice" {
		t.Fatalf("expected author name Alice, got %v", comment["AuthorName"])
	}
}

func TestCreateComment_MissingContent(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodPost, "/feed/1/comments", map[string]string{"content": ""}, 2)
	req.URL.Path = "/feed/1/comments"
	rr := httptest.NewRecorder()
	h.CreateComment(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestCreateComment_Unauthorized(t *testing.T) {
	h := newHandlerWithMock()
	req := httptest.NewRequest(http.MethodPost, "/feed/1/comments", strings.NewReader(`{"content":"hi"}`))
	req.Header.Set("Content-Type", "application/json")
	req.URL.Path = "/feed/1/comments"
	rr := httptest.NewRecorder()
	h.CreateComment(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestDeleteComment_Success(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	mdb.comments = append(mdb.comments, &models.Comment{ID: 1, PostID: 1, UserID: 2, Content: "Nice!", CreatedAt: time.Now(), UpdatedAt: time.Now()})
	h := newHandlerWith(mdb)
	req := authedReq(http.MethodDelete, "/feed/1/comments/1", nil, 2)
	req.URL.Path = "/feed/1/comments/1"
	rr := httptest.NewRecorder()
	h.DeleteComment(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestDeleteComment_Unauthorized(t *testing.T) {
	h := newHandlerWithMock()
	req := httptest.NewRequest(http.MethodDelete, "/feed/1/comments/1", nil)
	req.URL.Path = "/feed/1/comments/1"
	rr := httptest.NewRecorder()
	h.DeleteComment(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestGetComments_AfterCreate(t *testing.T) {
	mdb := newMockDB()
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	h := newHandlerWith(mdb)

	createReq := authedReq(http.MethodPost, "/feed/1/comments", map[string]string{"content": "First comment"}, 2)
	createReq.URL.Path = "/feed/1/comments"
	createRR := httptest.NewRecorder()
	h.CreateComment(createRR, createReq)
	if createRR.Code != http.StatusCreated {
		t.Fatalf("create failed: %d", createRR.Code)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/feed/1/comments", nil)
	getReq.URL.Path = "/feed/1/comments"
	getRR := httptest.NewRecorder()
	h.GetComments(getRR, getReq)
	if getRR.Code != http.StatusOK {
		t.Fatalf("get failed: %d", getRR.Code)
	}
}

func TestGetComments_IncludesAuthorName(t *testing.T) {
	mdb := newMockDB()
	mdb.users = append(mdb.users, &models.User{ID: 2, Email: "alice@ufl.edu", Name: "Alice", Role: "student"})
	mdb.posts = append(mdb.posts, &models.Post{ID: 1, Content: "Hello"})
	mdb.comments = append(mdb.comments, &models.Comment{ID: 1, PostID: 1, UserID: 2, Content: "Nice!", CreatedAt: time.Now(), UpdatedAt: time.Now()})
	h := newHandlerWith(mdb)

	req := httptest.NewRequest(http.MethodGet, "/feed/1/comments", nil)
	req.URL.Path = "/feed/1/comments"
	rr := httptest.NewRecorder()
	h.GetComments(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Comments []models.Comment `json:"comments"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("expected json body: %v", err)
	}
	if len(resp.Comments) != 1 {
		t.Fatalf("expected 1 comment, got %d", len(resp.Comments))
	}
	if resp.Comments[0].AuthorName != "Alice" {
		t.Fatalf("expected author name Alice, got %q", resp.Comments[0].AuthorName)
	}
}
