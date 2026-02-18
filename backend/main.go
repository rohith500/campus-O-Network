package main

import (
	"fmt"
	"net/http"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
)

func main() {
	// Load configuration
	cfg := config.Load()
	fmt.Printf("Starting Campus-O-Network API (%s) on port %s...\n", cfg.DBType, cfg.Port)

	// Connect to database
	database, err := db.New(cfg) // cfg is *config.Config, db.New must accept pointer
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
		return
	}
	defer database.Close()

	h := handlers.New(database)
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("/health", middleware.CORS(h.Health))
	mux.HandleFunc("/auth/register", middleware.CORS(h.Register))
	mux.HandleFunc("/auth/login", middleware.CORS(h.Login))
	mux.HandleFunc("/feed", middleware.CORS(h.GetFeed))

	// Protected routes (JWT)
	mux.HandleFunc("/students", middleware.CORS(middleware.Auth(h.Students)))
	mux.HandleFunc("/students/", middleware.CORS(middleware.Auth(h.StudentsByID)))

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	if err := server.ListenAndServe(); err != nil {
		fmt.Println("Server error:", err)
	}
}
