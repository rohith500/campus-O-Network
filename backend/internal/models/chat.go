package models

import "time"

// Channel represents a chat channel
type Channel struct {
	ID        int       `db:"id"`
	Name      string    `db:"name"`
	Type      string    `db:"type"` // club, event, dm, study_group
	CreatedBy int       `db:"created_by"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

// Message represents a message in a channel
type Message struct {
	ID        int       `db:"id"`
	ChannelID int       `db:"channel_id"`
	UserID    int       `db:"user_id"`
	Content   string    `db:"content"`
	CreatedAt time.Time `db:"created_at"`
}

// UserChannel represents channel membership
type UserChannel struct {
	ID        int       `db:"id"`
	ChannelID int       `db:"channel_id"`
	UserID    int       `db:"user_id"`
	JoinedAt  time.Time `db:"joined_at"`
}
