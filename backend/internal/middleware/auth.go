package middleware

import (
	"backend/internal/auth"
	"context"
	"net/http"
	"strings"
)

type contextKey string

const UserClaimsKey contextKey = "user_claims"

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" {
			http.Error(w, "missing authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
			http.Error(w, "invalid authorization header", http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateToken(strings.TrimSpace(parts[1]))
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
		next(w, r.WithContext(ctx))
	}
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return Auth(next)
}

func hasRole(userRole string, allowedRoles []string) bool {
	for _, role := range allowedRoles {
		if userRole == role {
			return true
		}
	}
	return false
}

// RequireRole enforces both authentication and role-based authorization.
func RequireRole(next http.HandlerFunc, allowedRoles ...string) http.HandlerFunc {
	return Auth(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := GetClaims(r)
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		if len(allowedRoles) > 0 && !hasRole(claims.Role, allowedRoles) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		next(w, r)
	})
}

func GetClaims(r *http.Request) (*auth.JWTClaims, bool) {
	claims, ok := r.Context().Value(UserClaimsKey).(*auth.JWTClaims)
	return claims, ok
}
