package db

import (
	"database/sql"
	"fmt"
	"time"

	"backend/internal/models"
)

// GetProfileByUserID retrieves a user profile by user ID (READ)
func (db *DB) GetProfileByUserID(userID int) (*models.UserProfile, error) {
	p := &models.UserProfile{}
	err := db.conn.QueryRow(
		`SELECT id, user_id, bio, interests, availability, skill_level, created_at, updated_at
		 FROM user_profiles WHERE user_id = ?`, userID,
	).Scan(&p.ID, &p.UserID, &p.Bio, &p.Interests, &p.Availability, &p.SkillLevel, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("profile not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}
	return p, nil
}

// UpsertProfile creates or updates a user profile (WRITE)
func (db *DB) UpsertProfile(userID int, bio, interests, availability, skillLevel string) (*models.UserProfile, error) {
	now := time.Now()
	_, err := db.conn.Exec(
		`INSERT INTO user_profiles (user_id, bio, interests, availability, skill_level, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(user_id) DO UPDATE SET
		   bio          = excluded.bio,
		   interests    = excluded.interests,
		   availability = excluded.availability,
		   skill_level  = excluded.skill_level,
		   updated_at   = excluded.updated_at`,
		userID, bio, interests, availability, skillLevel, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert profile: %w", err)
	}
	return db.GetProfileByUserID(userID)
}

// CreateComment adds a comment to a post (WRITE)
func (db *DB) CreateComment(postID, userID int, content string) (*models.Comment, error) {
	now := time.Now()
	result, err := db.conn.Exec(
		`INSERT INTO comments (post_id, user_id, content, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?)`,
		postID, userID, content, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get comment id: %w", err)
	}
	return db.GetCommentByID(int(id))
}

// GetCommentByID retrieves a comment by ID (READ)
func (db *DB) GetCommentByID(id int) (*models.Comment, error) {
	c := &models.Comment{}
	err := db.conn.QueryRow(
		`SELECT id, post_id, user_id, content, created_at, updated_at FROM comments WHERE id = ?`, id,
	).Scan(&c.ID, &c.PostID, &c.UserID, &c.Content, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("comment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get comment: %w", err)
	}
	return c, nil
}

// GetCommentsByPostID retrieves all comments for a post (READ)
func (db *DB) GetCommentsByPostID(postID int) ([]*models.Comment, error) {
	rows, err := db.conn.Query(
		`SELECT id, post_id, user_id, content, created_at, updated_at
		 FROM comments WHERE post_id = ? ORDER BY created_at ASC`, postID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}
	defer rows.Close()

	var comments []*models.Comment
	for rows.Next() {
		c := &models.Comment{}
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Content, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

// DeleteComment deletes a comment by ID (MODIFY)
func (db *DB) DeleteComment(commentID, userID int) error {
	result, err := db.conn.Exec(
		`DELETE FROM comments WHERE id = ? AND user_id = ?`, commentID, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("comment not found or not owned by user")
	}
	return nil
}
