package middleware

import (
	"backend/internal/auth"
	"context"
	"net/http"
	"strings"
)

type contextKey string

const userClaimsKey contextKey = "user_claims"

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

		ctx := context.WithValue(r.Context(), userClaimsKey, claims)
		next(w, r.WithContext(ctx))
	}
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return Auth(next)
}

func GetClaims(r *http.Request) (*auth.JWTClaims, bool) {
	claims, ok := r.Context().Value(userClaimsKey).(*auth.JWTClaims)
	return claims, ok
}
