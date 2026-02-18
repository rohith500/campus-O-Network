package models

import "time"

// User represents a campus user
type User struct {
	ID        int       `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"-" db:"password"` // NEVER expose password
	Name      string    `json:"name" db:"name"`
	Role      string    `json:"role" db:"role"` // student, ambassador, admin
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

// UserProfile represents extended user information
type UserProfile struct {
	ID           int       `json:"id" db:"id"`
	UserID       int       `json:"userId" db:"user_id"`
	Bio          string    `json:"bio" db:"bio"`
	Interests    string    `json:"interests" db:"interests"`
	Availability string    `json:"availability" db:"availability"`
	SkillLevel   string    `json:"skillLevel" db:"skill_level"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}
