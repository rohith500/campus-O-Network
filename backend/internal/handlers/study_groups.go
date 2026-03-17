package handlers

import (
	"backend/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

type createStudyRequestReq struct {
	Course       string `json:"course"`
	Topic        string `json:"topic"`
	Availability string `json:"availability"`
	SkillLevel   string `json:"skillLevel"`
}

type createStudyGroupReq struct {
	Course     string `json:"course"`
	Topic      string `json:"topic"`
	MaxMembers int    `json:"maxMembers"`
}

func (h *Handler) ListStudyRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	requests, err := h.db.ListStudyRequests()
	if err != nil {
		http.Error(w, "failed to list study requests", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "requests": requests})
}

func (h *Handler) CreateStudyRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var req createStudyRequestReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.Course = strings.TrimSpace(req.Course)
	req.Topic = strings.TrimSpace(req.Topic)
	if req.Course == "" || req.Topic == "" {
		http.Error(w, "course and topic are required", http.StatusBadRequest)
		return
	}
	sr, err := h.db.CreateStudyRequest(claims.UserID, req.Course, req.Topic, req.Availability, req.SkillLevel)
	if err != nil {
		http.Error(w, "failed to create study request", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "request": sr})
}

func (h *Handler) ListStudyGroups(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	groups, err := h.db.ListStudyGroups()
	if err != nil {
		http.Error(w, "failed to list study groups", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "groups": groups})
}

func (h *Handler) CreateStudyGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	_, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var req createStudyGroupReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.Course = strings.TrimSpace(req.Course)
	req.Topic = strings.TrimSpace(req.Topic)
	if req.Course == "" || req.Topic == "" {
		http.Error(w, "course and topic are required", http.StatusBadRequest)
		return
	}
	if req.MaxMembers <= 0 {
		req.MaxMembers = 5
	}
	group, err := h.db.CreateStudyGroup(req.Course, req.Topic, req.MaxMembers)
	if err != nil {
		http.Error(w, "failed to create study group", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "group": group})
}

func (h *Handler) JoinStudyGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	// Path: /study/groups/{id}/join → parts: ["study","groups","{id}","join"]
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}
	groupID, err := strconv.Atoi(parts[2])
	if err != nil || groupID <= 0 {
		http.Error(w, "invalid group id", http.StatusBadRequest)
		return
	}
	if err := h.db.JoinStudyGroup(groupID, claims.UserID); err != nil {
		http.Error(w, "failed to join study group", http.StatusInternalServerError)
		return
	}
	members, _ := h.db.GetStudyGroupMembers(groupID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "message": "joined study group", "members": members})
}
