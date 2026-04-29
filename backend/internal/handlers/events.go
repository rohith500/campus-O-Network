package handlers

import (
	"backend/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type createEventReq struct {
	ClubID      int    `json:"clubId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Location    string `json:"location"`
	Date        string `json:"date"`
	Capacity    int    `json:"capacity"`
}

type rsvpReq struct {
	Status string `json:"status"`
}

func (h *Handler) ListEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	clubID := 0
	if v := r.URL.Query().Get("club_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil {
			clubID = id
		}
	}
	events, err := h.db.ListEvents(clubID)
	if err != nil {
		http.Error(w, "failed to list events", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "events": events})
}

func (h *Handler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var req createEventReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" || req.Date == "" {
		http.Error(w, "title and date are required", http.StatusBadRequest)
		return
	}
	date, err := time.Parse(time.RFC3339, req.Date)
	if err != nil {
		http.Error(w, "invalid date format, use RFC3339", http.StatusBadRequest)
		return
	}
	if req.Capacity <= 0 {
		req.Capacity = 100
	}
	event, err := h.db.CreateEvent(req.ClubID, claims.UserID, req.Title, strings.TrimSpace(req.Description), strings.TrimSpace(req.Location), date, req.Capacity)
	if err != nil {
		http.Error(w, "failed to create event", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "event": event})
}

func (h *Handler) GetEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id, err := extractIDFromPath(r.URL.Path, "events")
	if err != nil {
		http.Error(w, "invalid event id", http.StatusBadRequest)
		return
	}
	event, err := h.db.GetEventByID(id)
	if err != nil {
		http.Error(w, "event not found", http.StatusNotFound)
		return
	}
	rsvps, err := h.db.GetRSVPs(id)
	if err != nil {
		http.Error(w, "failed to load event RSVPs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "event": event, "rsvps": rsvps})
}

func (h *Handler) RSVPEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 2 {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}
	eventID, err := strconv.Atoi(parts[1])
	if err != nil || eventID <= 0 {
		http.Error(w, "invalid event id", http.StatusBadRequest)
		return
	}
	var req rsvpReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	validStatuses := map[string]bool{"going": true, "maybe": true, "not_going": true}
	if !validStatuses[req.Status] {
		http.Error(w, "status must be going, maybe, or not_going", http.StatusBadRequest)
		return
	}
	if err := h.db.RSVPEvent(eventID, claims.UserID, req.Status); err != nil {
		http.Error(w, "failed to RSVP", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "message": "RSVP recorded", "status": req.Status})
}
