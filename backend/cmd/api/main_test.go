package main

import (
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	"bytes"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
)

func setupTestMux(t *testing.T) *http.ServeMux {
	t.Helper()
	t.Setenv("JWT_KEY", "test-secret")

	tempDBPath := filepath.Join(t.TempDir(), "test.db")
	database, err := db.New(&config.Config{DBType: "sqlite", DBPath: tempDBPath})
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Close()
	})

	return newMux(handlers.New(database))
}

func TestStudentsRoute_UnauthorizedWithoutToken(t *testing.T) {
	mux := setupTestMux(t)

	req := httptest.NewRequest(http.MethodGet, "/students", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestStudentsRoute_ForbiddenForStudentRoleOnCreate(t *testing.T) {
	mux := setupTestMux(t)
	token, err := auth.GenerateToken(1, "student@ufl.edu", "student")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/students", bytes.NewBufferString(`{"name":"Alice","email":"alice@ufl.edu","major":"CS","year":2}`))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestStudentsRoute_AllowsAdminCreate(t *testing.T) {
	mux := setupTestMux(t)
	token, err := auth.GenerateToken(1, "admin@ufl.edu", "admin")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/students", bytes.NewBufferString(`{"name":"Alice","email":"alice@ufl.edu","major":"CS","year":2}`))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestStudentsByIDRoute_ForbiddenForStudentRoleOnUpdate(t *testing.T) {
	mux := setupTestMux(t)
	token, err := auth.GenerateToken(1, "student@ufl.edu", "student")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	req := httptest.NewRequest(http.MethodPut, "/students/1", bytes.NewBufferString(`{"name":"Alice Updated","email":"alice@ufl.edu","major":"CS","year":3}`))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}
