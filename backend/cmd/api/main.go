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
	fmt.Printf("Starting Campus-O-Network API (%s) on port %s...\n", cfg.DBType, cfg.Port)

	database, err := db.New(cfg)
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
		return
	}
	defer database.Close()

	h := handlers.New(database)
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("/health", middleware.CORS(h.Health))

	// Auth
	mux.HandleFunc("/auth/register", middleware.CORS(h.Register))
	mux.HandleFunc("/auth/login", middleware.CORS(h.Login))

	// Feed
	mux.HandleFunc("/feed", middleware.CORS(h.GetFeed))
	mux.HandleFunc("/feed/create", middleware.CORS(middleware.Auth(h.CreatePost)))

	// Students
	mux.HandleFunc("/students", middleware.CORS(middleware.Auth(h.Students)))
	mux.HandleFunc("/students/", middleware.CORS(middleware.Auth(h.StudentsByID)))

	// Clubs
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

	// Events
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

	// Study Groups
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

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}
	if err := server.ListenAndServe(); err != nil {
		fmt.Println("Server error:", err)
	}
}
