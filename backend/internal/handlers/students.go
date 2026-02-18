package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

type createStudentReq struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Major string `json:"major"`
	Year  int    `json:"year"`
}

type updateStudentReq struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Major string `json:"major"`
	Year  int    `json:"year"`
}

func (h *Handler) Students(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listStudents(w, r)
	case http.MethodPost:
		h.createStudent(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) StudentsByID(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) != 2 {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[1])
	if err != nil || id <= 0 {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getStudent(w, r, id)
	case http.MethodPut:
		h.updateStudent(w, r, id)
	case http.MethodDelete:
		h.deleteStudent(w, r, id)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) createStudent(w http.ResponseWriter, r *http.Request) {
	var req createStudentReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	id, err := h.db.CreateStudent(req.Name, req.Email, req.Major, req.Year)
	if err != nil {
		http.Error(w, "failed to create student", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"ok":        true,
		"studentId": id,
	})
}

func (h *Handler) listStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.db.ListStudents()
	if err != nil {
		http.Error(w, "failed to list students", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"ok":       true,
		"students": students,
	})
}

func (h *Handler) getStudent(w http.ResponseWriter, r *http.Request, id int) {
	s, err := h.db.GetStudent(id)
	if err != nil {
		http.Error(w, "student not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"ok":      true,
		"student": s,
	})
}

func (h *Handler) updateStudent(w http.ResponseWriter, r *http.Request, id int) {
	var req updateStudentReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if err := h.db.UpdateStudent(id, req.Name, req.Email, req.Major, req.Year); err != nil {
		http.Error(w, "failed to update student", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"ok": true})
}

func (h *Handler) deleteStudent(w http.ResponseWriter, r *http.Request, id int) {
	if err := h.db.DeleteStudent(id); err != nil {
		http.Error(w, "failed to delete student", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"ok": true})
}
