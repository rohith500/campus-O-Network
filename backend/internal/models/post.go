package models

import "time"

// Post represents a feed post
type Post struct {
	ID         int       `db:"id"          json:"ID"`
	UserID     int       `db:"user_id"     json:"UserID"`
	AuthorName string    `db:"author_name" json:"AuthorName"`
	Content    string    `db:"content"     json:"Content"`
	Tags       string    `db:"tags"        json:"Tags"`
	Likes      int       `db:"likes"       json:"Likes"`
	CreatedAt  time.Time `db:"created_at"  json:"CreatedAt"`
	UpdatedAt  time.Time `db:"updated_at"  json:"UpdatedAt"`
	TimeAgo    string    `db:"-"           json:"TimeAgo"`
}

// Comment represents a comment on a post
type Comment struct {
	ID         int       `db:"id"         json:"ID"`
	PostID     int       `db:"post_id"    json:"PostID"`
	UserID     int       `db:"user_id"    json:"UserID"`
	AuthorName string    `db:"-"          json:"AuthorName"`
	Content    string    `db:"content"    json:"Content"`
	CreatedAt  time.Time `db:"created_at" json:"CreatedAt"`
	UpdatedAt  time.Time `db:"updated_at" json:"UpdatedAt"`
}
