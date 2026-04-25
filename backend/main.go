package main

import (
	"fmt"
	"net/http"
	"strings"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
)

func main() {
	cfg := config.Load()
	fmt.Printf("[sprint3] Starting Campus-O-Network API (%s) on port %s...\n", cfg.DBType, cfg.Port)

	database, err := db.New(cfg)
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
		return
	}
	defer database.Close()

	h := handlers.New(database)
	mux := http.NewServeMux()

	// ── Health & Auth ─────────────────────────────────────────────────────────
	mux.HandleFunc("/health", middleware.CORS(h.Health))
	mux.HandleFunc("/auth/register", middleware.CORS(h.Register))
	mux.HandleFunc("/auth/login", middleware.CORS(h.Login))

	// ── Students ──────────────────────────────────────────────────────────────
	mux.HandleFunc("/students", middleware.CORS(middleware.Auth(h.Students)))
	mux.HandleFunc("/students/", middleware.CORS(middleware.Auth(h.StudentsByID)))

	// ── Feed ──────────────────────────────────────────────────────────────────
	mux.HandleFunc("/feed", middleware.CORS(h.GetFeed))
	mux.HandleFunc("/feed/create", middleware.CORS(middleware.Auth(h.CreatePost)))

	// ── Clubs (Sprint 2) ──────────────────────────────────────────────────────
	mux.HandleFunc("/clubs", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.Auth(h.CreateClub)(w, r)
		} else {
			h.ListClubs(w, r)
		}
	}))
	mux.HandleFunc("/clubs/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case hasSuffix(r.URL.Path, "join"):
			middleware.Auth(h.JoinClub)(w, r)
		case hasSuffix(r.URL.Path, "leave"):
			middleware.Auth(h.LeaveClub)(w, r)
		default:
			h.GetClub(w, r)
		}
	}))

	// ── Events (Sprint 2) ─────────────────────────────────────────────────────
	mux.HandleFunc("/events", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.Auth(h.CreateEvent)(w, r)
		} else {
			h.ListEvents(w, r)
		}
	}))
	mux.HandleFunc("/events/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if hasSuffix(r.URL.Path, "rsvp") {
			middleware.Auth(h.RSVPEvent)(w, r)
		} else {
			h.GetEvent(w, r)
		}
	}))

	// ── Study Groups (Sprint 2) ───────────────────────────────────────────────
	mux.HandleFunc("/study/requests", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.Auth(h.CreateStudyRequest)(w, r)
		} else {
			h.ListStudyRequests(w, r)
		}
	}))
	mux.HandleFunc("/study/groups", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.Auth(h.CreateStudyGroup)(w, r)
		} else {
			h.ListStudyGroups(w, r)
		}
	}))
	mux.HandleFunc("/study/groups/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if hasSuffix(r.URL.Path, "join") {
			middleware.Auth(h.JoinStudyGroup)(w, r)
		} else if hasSuffix(r.URL.Path, "leave") {
			middleware.Auth(h.LeaveStudyGroup)(w, r)
		} else {
			h.GetStudyGroup(w, r)
		}
	}))

	// ── Profile (Sprint 3) ────────────────────────────────────────────────────
	mux.HandleFunc("/profile", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			middleware.Auth(h.UpdateProfile)(w, r)
		} else {
			middleware.Auth(h.GetProfile)(w, r)
		}
	}))

	// ── Likes & Comments (Sprint 3) ───────────────────────────────────────────
	mux.HandleFunc("/feed/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case hasSuffix(r.URL.Path, "like"):
			middleware.Auth(h.LikePost)(w, r)
		case hasSuffix(r.URL.Path, "comments"):
			if r.Method == http.MethodPost {
				middleware.Auth(h.CreateComment)(w, r)
			} else {
				h.GetComments(w, r)
			}
		case strings.Contains(r.URL.Path, "comments/"):
			middleware.Auth(h.DeleteComment)(w, r)
		default:
			h.GetPost(w, r)
		}
	}))

	fmt.Printf("Server listening on http://localhost:%s\n", cfg.Port)
	server := &http.Server{Addr: ":" + cfg.Port, Handler: mux}
	if err := server.ListenAndServe(); err != nil {
		fmt.Println("Server error:", err)
	}
}

// hasSuffix returns true if the last path segment matches action.
func hasSuffix(path, action string) bool {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	return len(parts) > 0 && parts[len(parts)-1] == action
}
