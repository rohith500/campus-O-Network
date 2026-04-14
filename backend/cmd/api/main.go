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


func newMux(h *handlers.Handler) *http.ServeMux {
	mux := http.NewServeMux()

	// ── Health ──────────────────────────────────────────────
	mux.HandleFunc("/health", middleware.CORS(h.Health))

	// ── Auth ────────────────────────────────────────────────
	mux.HandleFunc("/auth/register", middleware.CORS(h.Register))
	mux.HandleFunc("/auth/login", middleware.CORS(h.Login))

	// ── Profile (Sprint 3) ───────────────────────────────────
	mux.HandleFunc("/profile", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			middleware.Auth(h.GetProfile)(w, r)
		} else if r.Method == http.MethodPut {
			middleware.Auth(h.UpdateProfile)(w, r)
		} else {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// ── Feed ────────────────────────────────────────────────
	mux.HandleFunc("/feed", middleware.CORS(h.GetFeed))
	mux.HandleFunc("/feed/create", middleware.CORS(middleware.Auth(h.CreatePost)))
	mux.HandleFunc("/feed/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasSuffix(path, "/like") {
			middleware.Auth(h.LikePost)(w, r)
		} else if strings.HasSuffix(path, "/comments") {
			if r.Method == http.MethodGet {
				h.GetComments(w, r)
			} else if r.Method == http.MethodPost {
				middleware.Auth(h.CreateComment)(w, r)
			} else {
				http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			}
		} else if strings.Contains(path, "/comments/") {
			middleware.Auth(h.DeleteComment)(w, r)
		} else {
			http.Error(w, "not found", http.StatusNotFound)
		}
	}))

	// ── Students ────────────────────────────────────────────
	mux.HandleFunc("/students", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.Auth(h.Students)(w, r)
		case http.MethodPost:
			middleware.RequireRole(h.Students, "admin")(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/students/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.Auth(h.StudentsByID)(w, r)
		case http.MethodPut, http.MethodDelete:
			middleware.RequireRole(h.StudentsByID, "admin")(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// ── Clubs ────────────────────────────────────────────────
	mux.HandleFunc("/clubs", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.ListClubs(w, r)
		} else if r.Method == http.MethodPost {
			middleware.Auth(h.CreateClub)(w, r)
		} else {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/clubs/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasSuffix(path, "/join") {
			middleware.Auth(h.JoinClub)(w, r)
		} else if strings.HasSuffix(path, "/leave") {
			middleware.Auth(h.LeaveClub)(w, r)
		} else {
			h.GetClub(w, r)
		}
	}))

	// ── Events ───────────────────────────────────────────────
	mux.HandleFunc("/events", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.ListEvents(w, r)
		} else if r.Method == http.MethodPost {
			middleware.Auth(h.CreateEvent)(w, r)
		} else {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/events/", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/rsvp") {
			middleware.Auth(h.RSVPEvent)(w, r)
		} else {
			h.GetEvent(w, r)
		}
	}))

	// ── Study Groups ─────────────────────────────────────────
	mux.HandleFunc("/study/requests", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.ListStudyRequests(w, r)
		} else if r.Method == http.MethodPost {
			middleware.Auth(h.CreateStudyRequest)(w, r)
		} else {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/study/groups", middleware.CORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.ListStudyGroups(w, r)
		} else if r.Method == http.MethodPost {
			middleware.Auth(h.CreateStudyGroup)(w, r)
		} else {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/study/groups/", middleware.CORS(middleware.Auth(h.JoinStudyGroup)))

	return mux
}

func main() {
	cfg := config.Load()
	fmt.Printf("Starting Campus-O-Network API (%s) on port %s...\n", cfg.DBType, cfg.Port)

	database, err := db.New(cfg)
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
		return
	}
	defer database.Close()

	h := handlers.New(database)
	mux := newMux(h)

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	if err := server.ListenAndServe(); err != nil {
		fmt.Println("Server error:", err)
	}
}
