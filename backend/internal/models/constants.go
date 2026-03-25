package models

// User roles
const (
	RoleStudent    = "student"
	RoleAmbassador = "ambassador"
	RoleAdmin      = "admin"
)

// Club member roles
const (
	ClubRoleMember     = "member"
	ClubRoleAmbassador = "ambassador"
)

// RSVP statuses
const (
	RSVPGoing    = "going"
	RSVPMaybe    = "maybe"
	RSVPNotGoing = "not_going"
)

// Pagination defaults
const (
	DefaultPageLimit  = 10
	MaxPageLimit      = 100
	DefaultPageOffset = 0
)
