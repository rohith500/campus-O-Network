package db

import (
	"backend/internal/config"
	"database/sql"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

// DB wraps the database connection
type DB struct {
	conn *sql.DB
}

// New creates a new database connection (supports both SQLite and PostgreSQL)
func New(cfg *config.Config) (*DB, error) {
	var connStr string
	var driver string

	if cfg.DBType == "sqlite" {
		driver = "sqlite3"
		// Create data directory if it doesn't exist
		os.MkdirAll("./data", 0755)
		connStr = cfg.DBPath
	} else {
		driver = "postgres"
		connStr = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPass, cfg.DBName)
	}

	conn, err := sql.Open(driver, connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err = conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{conn: conn}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}
