package handlers

import (
	"net/http"
	"strconv"

	"backend/internal/models"
)

// parsePagination extracts and validates limit and offset from query params
func parsePagination(r *http.Request) (limit, offset int) {
	limit = models.DefaultPageLimit
	offset = models.DefaultPageOffset

	if v := r.URL.Query().Get("limit"); v != "" {
		if l, err := strconv.Atoi(v); err == nil && l > 0 {
			limit = l
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if o, err := strconv.Atoi(v); err == nil && o >= 0 {
			offset = o
		}
	}
	if limit > models.MaxPageLimit {
		limit = models.MaxPageLimit
	}
	return limit, offset
}
