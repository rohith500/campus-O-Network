package handlers

import (
	"backend/internal/db"
)

// Handler wraps all dependencies
type Handler struct {
	db *db.DB
}

// New creates a new handler with dependencies
func New(database *db.DB) *Handler {
	return &Handler{
		db: database,
	}
}
