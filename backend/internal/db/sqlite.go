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

// New creates a new DB connection
// FIXED: now accepts *config.Config (pointer)
func New(cfg *config.Config) (*DB, error) {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "app.db"
	}

	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	if err := conn.Ping(); err != nil {
		return nil, err
	}

	fmt.Println("Connected to SQLite:", dbPath)

	return &DB{conn: conn}, nil
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

