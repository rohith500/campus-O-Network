package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Exp    int64  `json:"exp"`
}

func signingKey() string {
	if key := os.Getenv("JWT_KEY"); key != "" {
		return key
	}
	return "your-secret-key"
}

func GenerateToken(userID int, email, role string) (string, error) {
	expiresAt := time.Now().Add(24 * time.Hour).Unix()
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     expiresAt,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(signingKey()))
}

func ValidateToken(token string) (*JWTClaims, error) {
	parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(signingKey()), nil
	})
	if err != nil || !parsedToken.Valid {
		return nil, errors.New("invalid token")
	}

	mapClaims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	userIDFloat, ok := mapClaims["user_id"].(float64)
	if !ok {
		return nil, errors.New("invalid user id claim")
	}

	email, ok := mapClaims["email"].(string)
	if !ok {
		return nil, errors.New("invalid email claim")
	}

	role, ok := mapClaims["role"].(string)
	if !ok {
		return nil, errors.New("invalid role claim")
	}

	expFloat, ok := mapClaims["exp"].(float64)
	if !ok {
		return nil, errors.New("invalid exp claim")
	}

	return &JWTClaims{
		UserID: int(userIDFloat),
		Email:  email,
		Role:   role,
		Exp:    int64(expFloat),
	}, nil
}
