package handlers

import (
	"backend/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

type createCommentReq struct {
	Content string `json:"content"`
}

// LikePost handles POST /feed/{id}/like — protected
func (h *Handler) LikePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	_, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := extractIDFromPath(r.URL.Path, "feed")
	if err != nil {
		http.Error(w, "invalid post id", http.StatusBadRequest)
		return
	}

	if err := h.db.LikePost(id); err != nil {
		http.Error(w, "failed to like post", http.StatusInternalServerError)
		return
	}

	post, err := h.db.GetPostByID(id)
	if err != nil {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":    true,
		"likes": post.Likes,
	})
}

// GetComments handles GET /feed/{id}/comments — public
func (h *Handler) GetComments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id, err := extractIDFromPath(r.URL.Path, "feed")
	if err != nil {
		http.Error(w, "invalid post id", http.StatusBadRequest)
		return
	}

	comments, err := h.db.GetCommentsByPostID(id)
	if err != nil {
		http.Error(w, "failed to get comments", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":       true,
		"comments": comments,
	})
}

// CreateComment handles POST /feed/{id}/comments — protected
func (h *Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := extractIDFromPath(r.URL.Path, "feed")
	if err != nil {
		http.Error(w, "invalid post id", http.StatusBadRequest)
		return
	}

	var req createCommentReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		http.Error(w, "content is required", http.StatusBadRequest)
		return
	}

	comment, err := h.db.CreateComment(id, claims.UserID, req.Content)
	if err != nil {
		http.Error(w, "failed to create comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"comment": comment,
	})
}

// DeleteComment handles DELETE /feed/{id}/comments/{commentId} — protected
func (h *Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Path: /feed/{id}/comments/{commentId}
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}
	commentID, err := strconv.Atoi(parts[3])
	if err != nil || commentID <= 0 {
		http.Error(w, "invalid comment id", http.StatusBadRequest)
		return
	}

	if err := h.db.DeleteComment(commentID, claims.UserID); err != nil {
		http.Error(w, "failed to delete comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "comment deleted",
	})
}
