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
	fmt.Printf("Starting Campus-O-Network(%s) on port %s...\n", cfg.DBType, cfg.Port)

	database, err := db.New(cfg)
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
		return
	}
	defer database.Close()

	h := handlers.New(database)
	mux := http.NewServeMux()
	mux.HandleFunc("/health", middleware.CORS(h.Health))
	mux.HandleFunc("/auth/register", middleware.CORS(h.Register))
	mux.HandleFunc("/auth/login", middleware.CORS(h.Login))

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	if err := server.ListenAndServe(); err != nil {
		fmt.Println("Server error:", err)
	}
}
