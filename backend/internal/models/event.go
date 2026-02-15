package models

import "time"

// Club represents a campus club
type Club struct {
	ID          int       `db:"id"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

// ClubMember represents membership in a club
type ClubMember struct {
	ID       int       `db:"id"`
	ClubID   int       `db:"club_id"`
	UserID   int       `db:"user_id"`
	Role     string    `db:"role"` // member, ambassador
	JoinedAt time.Time `db:"joined_at"`
}

// Event represents a campus event
type Event struct {
	ID          int       `db:"id"`
	ClubID      int       `db:"club_id"`
	CreatorID   int       `db:"creator_id"`
	Title       string    `db:"title"`
	Description string    `db:"description"`
	Date        time.Time `db:"date"`
	Location    string    `db:"location"`
	Capacity    int       `db:"capacity"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

// RSVP represents an event RSVP
type RSVP struct {
	ID        int       `db:"id"`
	EventID   int       `db:"event_id"`
	UserID    int       `db:"user_id"`
	Status    string    `db:"status"` // going, maybe, not_going
	CreatedAt time.Time `db:"created_at"`
}
