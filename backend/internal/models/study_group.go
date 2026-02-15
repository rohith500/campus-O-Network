package models

import "time"

// StudyRequest represents a request to find study partners
type StudyRequest struct {
	ID           int       `db:"id"`
	UserID       int       `db:"user_id"`
	Course       string    `db:"course"`
	Topic        string    `db:"topic"`
	Availability string    `db:"availability"`
	SkillLevel   string    `db:"skill_level"`
	Matched      bool      `db:"matched"`
	CreatedAt    time.Time `db:"created_at"`
	ExpiresAt    time.Time `db:"expires_at"`
}

// StudyGroup represents a matched study group
type StudyGroup struct {
	ID         int       `db:"id"`
	ChannelID  int       `db:"channel_id"`
	Course     string    `db:"course"`
	Topic      string    `db:"topic"`
	MaxMembers int       `db:"max_members"`
	CreatedAt  time.Time `db:"created_at"`
	ExpiresAt  time.Time `db:"expires_at"`
}

// StudyGroupMember represents membership in a study group
type StudyGroupMember struct {
	ID           int       `db:"id"`
	StudyGroupID int       `db:"study_group_id"`
	UserID       int       `db:"user_id"`
	JoinedAt     time.Time `db:"joined_at"`
}
