package handlers

import (
	"backend/internal/middleware"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

type createClubReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type joinClubReq struct {
	Role string `json:"role"`
}

func (h *Handler) ListClubs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	clubs, err := h.db.ListClubs()
	if err != nil {
		http.Error(w, "failed to list clubs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "clubs": clubs})
}

func (h *Handler) CreateClub(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var req createClubReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	club, err := h.db.CreateClub(req.Name, strings.TrimSpace(req.Description), claims.UserID)
	if err != nil {
		http.Error(w, "failed to create club", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "club": club})
}

func (h *Handler) GetClub(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id, err := extractIDFromPath(r.URL.Path, "clubs")
	if err != nil {
		http.Error(w, "invalid club id", http.StatusBadRequest)
		return
	}
	club, err := h.db.GetClubByID(id)
	if err != nil {
		http.Error(w, "club not found", http.StatusNotFound)
		return
	}
	members, err := h.db.GetClubMembers(id)
	if err != nil {
		http.Error(w, "failed to load club members", http.StatusInternalServerError)
		return
	}
	h.respondJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "club": club, "members": members})
}

func (h *Handler) JoinClub(w http.ResponseWriter, r *http.Request) {
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
	clubID, err := strconv.Atoi(parts[1])
	if err != nil || clubID <= 0 {
		http.Error(w, "invalid club id", http.StatusBadRequest)
		return
	}
	var req joinClubReq
	json.NewDecoder(r.Body).Decode(&req)
	role := strings.TrimSpace(req.Role)
	if role == "" {
		role = "member"
	}
	if err := h.db.JoinClub(clubID, claims.UserID, role); err != nil {
		http.Error(w, "failed to join club", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "message": "joined club"})
}

func (h *Handler) LeaveClub(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
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
	clubID, err := strconv.Atoi(parts[1])
	if err != nil || clubID <= 0 {
		http.Error(w, "invalid club id", http.StatusBadRequest)
		return
	}
	if err := h.db.LeaveClub(clubID, claims.UserID); err != nil {
		http.Error(w, "failed to leave club", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "message": "left club"})
}

func extractIDFromPath(path, prefix string) (int, error) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, p := range parts {
		if p == prefix && i+1 < len(parts) {
			return strconv.Atoi(parts[i+1])
		}
	}
	return 0, fmt.Errorf("id not found in path")
}
