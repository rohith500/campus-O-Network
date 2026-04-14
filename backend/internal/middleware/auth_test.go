package middleware

import (
	"backend/internal/auth"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireRole_UnauthorizedWithoutToken(t *testing.T) {
	h := RequireRole(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}, "admin")

	req := httptest.NewRequest(http.MethodGet, "/students", nil)
	rr := httptest.NewRecorder()
	h(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestRequireRole_ForbiddenForWrongRole(t *testing.T) {
	t.Setenv("JWT_KEY", "test-secret")
	token, err := auth.GenerateToken(1, "student@ufl.edu", "student")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	h := RequireRole(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}, "admin")

	req := httptest.NewRequest(http.MethodGet, "/students", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	h(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestRequireRole_AllowsMatchingRole(t *testing.T) {
	t.Setenv("JWT_KEY", "test-secret")
	token, err := auth.GenerateToken(1, "admin@ufl.edu", "admin")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	h := RequireRole(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}, "admin")

	req := httptest.NewRequest(http.MethodGet, "/students", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	h(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
