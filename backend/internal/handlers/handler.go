package handlers

import "backend/internal/db"

// Handler wraps all dependencies
type Handler struct {
	db db.Database
}

// New creates a new handler with dependencies
func New(database db.Database) *Handler {
	return &Handler{db: database}
}
