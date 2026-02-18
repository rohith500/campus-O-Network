package db

import (
	"database/sql"
	"fmt"
	"time"

	"backend/internal/models"
)

// CreateUser creates a new user in the database (WRITE)
func (db *DB) CreateUser(email, passwordHash, name, role string) (*models.User, error) {
	now := time.Now()
	result, err := db.conn.Exec(
		`INSERT INTO users (email, password, name, role, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		email, passwordHash, name, role, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	newID, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to read new user id: %w", err)
	}

	return db.GetUserByID(int(newID))
}

// GetUserByID retrieves a user by ID (READ)
func (db *DB) GetUserByID(id int) (*models.User, error) {
	user := &models.User{}
	err := db.conn.QueryRow(
		`SELECT id, email, password, name, role, created_at, updated_at
		 FROM users WHERE id = ?`,
		id,
	).Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// GetUserByEmail retrieves a user by email (READ)
func (db *DB) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := db.conn.QueryRow(
		`SELECT id, email, password, name, role, created_at, updated_at
		 FROM users WHERE email = ?`,
		email,
	).Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// UpdateUser updates user information (MODIFY)
func (db *DB) UpdateUser(id int, name, role string) error {
	result, err := db.conn.Exec(
		`UPDATE users SET name = ?, role = ?, updated_at = ?
		 WHERE id = ?`,
		name, role, time.Now(), id,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// DeleteUser deletes a user (MODIFY)
func (db *DB) DeleteUser(id int) error {
	result, err := db.conn.Exec(`DELETE FROM users WHERE id = ?`, id)

	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
