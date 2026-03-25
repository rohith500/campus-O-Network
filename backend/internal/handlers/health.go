package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

// Health returns the health status of the API
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "ok",
		"message":   "Campus-O-Network API is running",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// Ping is an alias for Health used in integration checks
func (h *Handler) Ping(w http.ResponseWriter, r *http.Request) {
	h.Health(w, r)
}
