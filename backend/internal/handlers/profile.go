package handlers

import (
	"backend/internal/middleware"
	"encoding/json"
	"net/http"
	"strings"
)

type upsertProfileReq struct {
	Bio          string `json:"bio"`
	Interests    string `json:"interests"`
	Availability string `json:"availability"`
	SkillLevel   string `json:"skillLevel"`
}

// GetProfile handles GET /profile — protected
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	profile, err := h.db.GetProfileByUserID(claims.UserID)
	if err != nil {
		if err.Error() != "profile not found" {
			http.Error(w, "failed to get profile", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":      true,
			"profile": nil,
			"message": "no profile found, use PUT /profile to create one",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"profile": profile,
	})
}

// UpdateProfile handles PUT /profile — protected
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req upsertProfileReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.Bio = strings.TrimSpace(req.Bio)
	req.Interests = strings.TrimSpace(req.Interests)
	req.Availability = strings.TrimSpace(req.Availability)
	req.SkillLevel = strings.TrimSpace(req.SkillLevel)

	profile, err := h.db.UpsertProfile(claims.UserID, req.Bio, req.Interests, req.Availability, req.SkillLevel)
	if err != nil {
		http.Error(w, "failed to update profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"profile": profile,
	})
}
