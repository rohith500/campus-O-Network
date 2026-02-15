package db

import (
	"database/sql"
	"fmt"
	"time"

	"backend/internal/models"
)

// CreatePost creates a new feed post (WRITE)
func (db *DB) CreatePost(userID int, content, tags string) (*models.Post, error) {
	post := &models.Post{}
	err := db.conn.QueryRow(
		`INSERT INTO feed_posts (user_id, content, tags, likes, created_at, updated_at)
		 VALUES ($1, $2, $3, 0, $4, $5)
		 RETURNING id, user_id, content, tags, likes, created_at, updated_at`,
		userID, content, tags, time.Now(), time.Now(),
	).Scan(&post.ID, &post.UserID, &post.Content, &post.Tags, &post.Likes, &post.CreatedAt, &post.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}
	return post, nil
}

// GetPostByID retrieves a post by ID (READ)
func (db *DB) GetPostByID(id int) (*models.Post, error) {
	post := &models.Post{}
	err := db.conn.QueryRow(
		`SELECT id, user_id, content, tags, likes, created_at, updated_at
		 FROM feed_posts WHERE id = $1`,
		id,
	).Scan(&post.ID, &post.UserID, &post.Content, &post.Tags, &post.Likes, &post.CreatedAt, &post.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("post not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}
	return post, nil
}

// GetAllPosts retrieves all feed posts with pagination (READ)
func (db *DB) GetAllPosts(limit, offset int) ([]*models.Post, error) {
	rows, err := db.conn.Query(
		`SELECT id, user_id, content, tags, likes, created_at, updated_at
		 FROM feed_posts
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		post := &models.Post{}
		if err := rows.Scan(&post.ID, &post.UserID, &post.Content, &post.Tags, &post.Likes, &post.CreatedAt, &post.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return posts, nil
}

// UpdatePost updates a post (MODIFY)
func (db *DB) UpdatePost(id int, content, tags string) error {
	result, err := db.conn.Exec(
		`UPDATE feed_posts SET content = $1, tags = $2, updated_at = $3
		 WHERE id = $4`,
		content, tags, time.Now(), id,
	)

	if err != nil {
		return fmt.Errorf("failed to update post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("post not found")
	}

	return nil
}

// DeletePost deletes a post (MODIFY)
func (db *DB) DeletePost(id int) error {
	result, err := db.conn.Exec(`DELETE FROM feed_posts WHERE id = $1`, id)

	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("post not found")
	}

	return nil
}

// LikePost increments the like count (MODIFY)
func (db *DB) LikePost(id int) error {
	result, err := db.conn.Exec(
		`UPDATE feed_posts SET likes = likes + 1, updated_at = $1
		 WHERE id = $2`,
		time.Now(), id,
	)

	if err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("post not found")
	}

	return nil
}
