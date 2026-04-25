package db

import (
	"database/sql"
	"fmt"
	"time"

	"backend/internal/models"
)

func (db *DB) CreatePost(userID int, content, tags string) (*models.Post, error) {
	now := time.Now()
	result, err := db.conn.Exec(
		`INSERT INTO feed_posts (user_id, content, tags, likes, created_at, updated_at)
		 VALUES (?, ?, ?, 0, ?, ?)`,
		userID, content, tags, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}
	newID, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to read new post id: %w", err)
	}
	return db.GetPostByID(int(newID))
}

func (db *DB) GetPostByID(id int) (*models.Post, error) {
	post := &models.Post{}
	err := db.conn.QueryRow(
		`SELECT p.id, p.user_id, COALESCE(u.name, 'Unknown') as author_name,
		        p.content, p.tags, p.likes, p.created_at, p.updated_at
		 FROM feed_posts p
		 LEFT JOIN users u ON u.id = p.user_id
		 WHERE p.id = ?`,
		id,
	).Scan(&post.ID, &post.UserID, &post.AuthorName, &post.Content, &post.Tags, &post.Likes, &post.CreatedAt, &post.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("post not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}
	return post, nil
}

func (db *DB) GetAllPosts(limit, offset int) ([]*models.Post, error) {
	rows, err := db.conn.Query(
		`SELECT p.id, p.user_id, COALESCE(u.name, 'Unknown') as author_name,
		        p.content, p.tags, p.likes, p.created_at, p.updated_at
		 FROM feed_posts p
		 LEFT JOIN users u ON u.id = p.user_id
		 ORDER BY p.created_at DESC
		 LIMIT ? OFFSET ?`,
		limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		post := &models.Post{}
		if err := rows.Scan(&post.ID, &post.UserID, &post.AuthorName, &post.Content, &post.Tags, &post.Likes, &post.CreatedAt, &post.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return posts, nil
}

func (db *DB) UpdatePost(id int, content, tags string) error {
	result, err := db.conn.Exec(
		`UPDATE feed_posts SET content = ?, tags = ?, updated_at = ? WHERE id = ?`,
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

func (db *DB) DeletePost(id int) error {
	result, err := db.conn.Exec(`DELETE FROM feed_posts WHERE id = ?`, id)
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

func (db *DB) LikePost(id int) error {
	result, err := db.conn.Exec(
		`UPDATE feed_posts SET likes = likes + 1, updated_at = ? WHERE id = ?`,
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


// HasLiked checks if a user has already liked a post
func (db *DB) HasLiked(postID, userID int) (bool, error) {
	var count int
	err := db.conn.QueryRow(
		`SELECT COUNT(*) FROM post_likes WHERE post_id = ? AND user_id = ?`,
		postID, userID,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// ToggleLike adds or removes a like
func (db *DB) ToggleLike(postID, userID int) (bool, error) {
	already, err := db.HasLiked(postID, userID)
	if err != nil {
		return false, err
	}
	now := time.Now()
	if already {
		_, err = db.conn.Exec(
			`DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
			postID, userID,
		)
		if err != nil {
			return false, err
		}
		_, err = db.conn.Exec(
			`UPDATE feed_posts SET likes = MAX(0, likes - 1), updated_at = ? WHERE id = ?`,
			now, postID,
		)
		return false, err
	}
	_, err = db.conn.Exec(
		`INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`,
		postID, userID, now,
	)
	if err != nil {
		return false, err
	}
	_, err = db.conn.Exec(
		`UPDATE feed_posts SET likes = likes + 1, updated_at = ? WHERE id = ?`,
		now, postID,
	)
	return true, err
}
