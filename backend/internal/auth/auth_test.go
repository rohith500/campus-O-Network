package auth

import "testing"

func TestHashPassword(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if hash == "" {
		t.Fatalf("expected non-empty hash")
	}
	if hash == "secret123" {
		t.Fatalf("expected hashed value, got plain password")
	}
}

func TestVerifyPassword_Correct(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	ok, err := VerifyPassword("secret123", hash)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if !ok {
		t.Fatalf("expected password verification to succeed")
	}
}

func TestVerifyPassword_Wrong(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	ok, err := VerifyPassword("wrong", hash)
	if err != nil {
		t.Fatalf("expected nil error for mismatch, got %v", err)
	}
	if ok {
		t.Fatalf("expected password verification to fail")
	}
}

func TestGenerateToken(t *testing.T) {
	token, err := GenerateToken(7, "alice@ufl.edu", "student")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if token == "" {
		t.Fatalf("expected non-empty token")
	}
}

func TestValidateToken_Valid(t *testing.T) {
	token, err := GenerateToken(7, "alice@ufl.edu", "student")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("expected valid token, got error %v", err)
	}
	if claims.UserID != 7 || claims.Email != "alice@ufl.edu" || claims.Role != "student" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
	if claims.Exp <= 0 {
		t.Fatalf("expected positive exp in claims")
	}
}

func TestValidateToken_Invalid(t *testing.T) {
	claims, err := ValidateToken("not.a.valid.token")
	if err == nil {
		t.Fatalf("expected error for invalid token")
	}
	if claims != nil {
		t.Fatalf("expected nil claims for invalid token")
	}
}
