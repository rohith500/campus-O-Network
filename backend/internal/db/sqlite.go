package db

import (
	"backend/internal/config"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// DB wraps the database connection
type DB struct {
	conn *sql.DB
}

// New creates a new DB connection
// FIXED: now accepts *config.Config (pointer)
func New(cfg *config.Config) (*DB, error) {
	dbPath := cfg.DBPath
	if dbPath == "" {
		dbPath = os.Getenv("DB_PATH")
	}
	if dbPath == "" {
		dbPath = "app.db"
	}

	dbDir := filepath.Dir(dbPath)
	if dbDir != "." {
		if err := os.MkdirAll(dbDir, 0o755); err != nil {
			return nil, err
		}
	}

	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	if err := conn.Ping(); err != nil {
		return nil, err
	}

	if err := bootstrapSchema(conn); err != nil {
		return nil, err
	}

	fmt.Println("Connected to SQLite:", dbPath)

	return &DB{conn: conn}, nil
}

func bootstrapSchema(conn *sql.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			name TEXT NOT NULL,
			role TEXT DEFAULT 'student',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS feed_posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			tags TEXT,
			likes INT DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS students (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			major TEXT,
			year INTEGER CHECK (year >= 1 AND year <= 8),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON feed_posts(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON feed_posts(created_at DESC)`,
		`CREATE TRIGGER IF NOT EXISTS trg_students_updated_at
		AFTER UPDATE ON students
		FOR EACH ROW
		BEGIN
			UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
		END`,
	}

	for _, stmt := range statements {
		if _, err := conn.Exec(stmt); err != nil {
			return err
		}
	}

	return nil
}

func (d *DB) Close() error {
	return d.conn.Close()
}

// ---------------- STUDENTS CRUD ----------------

type StudentRow struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Major     string `json:"major"`
	Year      int    `json:"year"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func (d *DB) CreateStudent(name, email, major string, year int) (int64, error) {
	res, err := d.conn.Exec(
		`INSERT INTO students(name,email,major,year) VALUES(?,?,?,?)`,
		name, email, major, year,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (d *DB) ListStudents() ([]StudentRow, error) {
	rows, err := d.conn.Query(
		`SELECT id,name,email,major,year,created_at,updated_at FROM students ORDER BY id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []StudentRow
	for rows.Next() {
		var s StudentRow
		if err := rows.Scan(&s.ID, &s.Name, &s.Email, &s.Major, &s.Year, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, nil
}

func (d *DB) GetStudent(id int) (*StudentRow, error) {
	var s StudentRow
	err := d.conn.QueryRow(
		`SELECT id,name,email,major,year,created_at,updated_at FROM students WHERE id=?`,
		id,
	).Scan(&s.ID, &s.Name, &s.Email, &s.Major, &s.Year, &s.CreatedAt, &s.UpdatedAt)

	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (d *DB) UpdateStudent(id int, name, email, major string, year int) error {
	_, err := d.conn.Exec(
		`UPDATE students SET name=?, email=?, major=?, year=? WHERE id=?`,
		name, email, major, year, id,
	)
	return err
}

func (d *DB) DeleteStudent(id int) error {
	_, err := d.conn.Exec(`DELETE FROM students WHERE id=?`, id)
	return err
}
