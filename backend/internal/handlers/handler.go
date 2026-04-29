package handlers

import (
	"backend/internal/db"
	"encoding/json"
	"net/http"
)

// Handler wraps all dependencies
type Handler struct {
	db db.Database
}

// New creates a new handler with dependencies
func New(database db.Database) *Handler {
	return &Handler{db: database}
}

func (h *Handler) respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
