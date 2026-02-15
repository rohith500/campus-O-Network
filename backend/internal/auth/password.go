package auth

// HashPassword hashes a password (TODO: use bcrypt)
func HashPassword(password string) (string, error) {
	// TODO: Implement proper bcrypt hashing
	return password, nil
}

// VerifyPassword verifies a password against a hash
func VerifyPassword(password, hash string) (bool, error) {
	// TODO: Implement proper bcrypt verification
	return password == hash, nil
}
