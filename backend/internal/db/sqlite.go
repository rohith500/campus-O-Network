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
		// ── Sprint 1 ────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS users (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			email      TEXT UNIQUE NOT NULL,
			password   TEXT NOT NULL,
			name       TEXT NOT NULL,
			role       TEXT DEFAULT 'student',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS feed_posts (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content    TEXT NOT NULL,
			tags       TEXT,
			likes      INT DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS students (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			name       TEXT NOT NULL,
			email      TEXT NOT NULL UNIQUE,
			major      TEXT,
			year       INTEGER CHECK (year >= 1 AND year <= 8),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON feed_posts(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON feed_posts(created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)`,
		`CREATE INDEX IF NOT EXISTS idx_study_requests_course ON study_requests(course)`,
		`CREATE TRIGGER IF NOT EXISTS trg_students_updated_at
		AFTER UPDATE ON students
		FOR EACH ROW
		BEGIN
			UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
		END`,

		// ── Sprint 2 ────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS clubs (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			name        TEXT NOT NULL UNIQUE,
			description TEXT NOT NULL DEFAULT '',
			created_by  INTEGER NOT NULL,
			created_at  DATETIME NOT NULL,
			updated_at  DATETIME NOT NULL,
			FOREIGN KEY (created_by) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS club_members (
			id        INTEGER PRIMARY KEY AUTOINCREMENT,
			club_id   INTEGER NOT NULL,
			user_id   INTEGER NOT NULL,
			role      TEXT NOT NULL DEFAULT 'member',
			joined_at DATETIME NOT NULL,
			UNIQUE(club_id, user_id),
			FOREIGN KEY (club_id) REFERENCES clubs(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS events (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			club_id     INTEGER NOT NULL DEFAULT 0,
			creator_id  INTEGER NOT NULL,
			title       TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			location    TEXT NOT NULL DEFAULT '',
			date        DATETIME NOT NULL,
			capacity    INTEGER NOT NULL DEFAULT 100,
			created_at  DATETIME NOT NULL,
			updated_at  DATETIME NOT NULL,
			FOREIGN KEY (creator_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS rsvps (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			event_id   INTEGER NOT NULL,
			user_id    INTEGER NOT NULL,
			status     TEXT NOT NULL DEFAULT 'going',
			created_at DATETIME NOT NULL,
			UNIQUE(event_id, user_id),
			FOREIGN KEY (event_id) REFERENCES events(id),
			FOREIGN KEY (user_id)  REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS study_requests (
			id           INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id      INTEGER NOT NULL,
			course       TEXT NOT NULL,
			topic        TEXT NOT NULL,
			availability TEXT NOT NULL DEFAULT '',
			skill_level  TEXT NOT NULL DEFAULT '',
			matched      INTEGER NOT NULL DEFAULT 0,
			created_at   DATETIME NOT NULL,
			expires_at   DATETIME NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS study_groups (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			course      TEXT NOT NULL,
			topic       TEXT NOT NULL,
			max_members INTEGER NOT NULL DEFAULT 5,
			created_at  DATETIME NOT NULL,
			expires_at  DATETIME NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS study_group_members (
			id             INTEGER PRIMARY KEY AUTOINCREMENT,
			study_group_id INTEGER NOT NULL,
			user_id        INTEGER NOT NULL,
			joined_at      DATETIME NOT NULL,
			UNIQUE(study_group_id, user_id),
			FOREIGN KEY (study_group_id) REFERENCES study_groups(id),
			FOREIGN KEY (user_id)        REFERENCES users(id)
		)`,

		// ── Sprint 3 ────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS user_profiles (
			id           INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id      INTEGER NOT NULL UNIQUE,
			bio          TEXT NOT NULL DEFAULT '',
			interests    TEXT NOT NULL DEFAULT '',
			availability TEXT NOT NULL DEFAULT '',
			skill_level  TEXT NOT NULL DEFAULT '',
			created_at   DATETIME NOT NULL,
			updated_at   DATETIME NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS comments (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			post_id    INTEGER NOT NULL,
			user_id    INTEGER NOT NULL,
			content    TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			FOREIGN KEY (post_id) REFERENCES feed_posts(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
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

// ── Students CRUD ────────────────────────────────────────────────────────────

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
