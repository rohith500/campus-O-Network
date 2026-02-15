package models

import "time"

// User represents a campus user
type User struct {
	ID        int       `db:"id"`
	Email     string    `db:"email"`
	Password  string    `db:"password"`
	Name      string    `db:"name"`
	Role      string    `db:"role"` // student, ambassador, admin
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

// UserProfile represents extended user information
type UserProfile struct {
	ID           int       `db:"id"`
	UserID       int       `db:"user_id"`
	Bio          string    `db:"bio"`
	Interests    string    `db:"interests"` // JSON or comma-separated
	Availability string    `db:"availability"`
	SkillLevel   string    `db:"skill_level"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
