package main

import (
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"fmt"
	"net/http"
)

func main() {
	// Load configuration
	cfg := config.Load()
	fmt.Printf("Starting Campus-O-Network API (%s) on port %s...\n", cfg.DBType, cfg.Port)

	// Connect to database
	database, err := db.New(cfg) // Pass config instead of connection string
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
		return
	}
	defer database.Close()

	// Rest of the code stays the same...
	h := handlers.New(database)
	mux := http.NewServeMux()
	mux.HandleFunc("/health", middleware.CORS(h.Health))
	mux.HandleFunc("/auth/register", middleware.CORS(h.Register))
	mux.HandleFunc("/auth/login", middleware.CORS(h.Login))
	mux.HandleFunc("/feed", middleware.CORS(h.GetFeed))

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	if err := server.ListenAndServe(); err != nil {
		fmt.Println("Server error:", err)
	}
}
