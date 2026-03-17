package db

import (
	"database/sql"
	"fmt"
	"time"

	"backend/internal/models"
)

func (db *DB) CreateEvent(clubID, creatorID int, title, description, location string, date time.Time, capacity int) (*models.Event, error) {
	now := time.Now()
	result, err := db.conn.Exec(
		`INSERT INTO events (club_id, creator_id, title, description, location, date, capacity, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		clubID, creatorID, title, description, location, date, capacity, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get event id: %w", err)
	}
	return db.GetEventByID(int(id))
}

func (db *DB) GetEventByID(id int) (*models.Event, error) {
	e := &models.Event{}
	err := db.conn.QueryRow(
		`SELECT id, club_id, creator_id, title, description, location, date, capacity, created_at, updated_at
		 FROM events WHERE id = ?`, id,
	).Scan(&e.ID, &e.ClubID, &e.CreatorID, &e.Title, &e.Description, &e.Location, &e.Date, &e.Capacity, &e.CreatedAt, &e.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("event not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get event: %w", err)
	}
	return e, nil
}

func (db *DB) ListEvents(clubID int) ([]*models.Event, error) {
	var rows *sql.Rows
	var err error
	if clubID > 0 {
		rows, err = db.conn.Query(
			`SELECT id, club_id, creator_id, title, description, location, date, capacity, created_at, updated_at
			 FROM events WHERE club_id = ? ORDER BY date ASC`, clubID,
		)
	} else {
		rows, err = db.conn.Query(
			`SELECT id, club_id, creator_id, title, description, location, date, capacity, created_at, updated_at
			 FROM events ORDER BY date ASC`,
		)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}
	defer rows.Close()

	var events []*models.Event
	for rows.Next() {
		e := &models.Event{}
		if err := rows.Scan(&e.ID, &e.ClubID, &e.CreatorID, &e.Title, &e.Description, &e.Location, &e.Date, &e.Capacity, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

func (db *DB) RSVPEvent(eventID, userID int, status string) error {
	_, err := db.conn.Exec(
		`INSERT INTO rsvps (event_id, user_id, status, created_at) VALUES (?, ?, ?, ?)
		 ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status`,
		eventID, userID, status, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to RSVP: %w", err)
	}
	return nil
}

func (db *DB) GetRSVPs(eventID int) ([]*models.RSVP, error) {
	rows, err := db.conn.Query(
		`SELECT id, event_id, user_id, status, created_at FROM rsvps WHERE event_id = ?`, eventID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get RSVPs: %w", err)
	}
	defer rows.Close()

	var rsvps []*models.RSVP
	for rows.Next() {
		rv := &models.RSVP{}
		if err := rows.Scan(&rv.ID, &rv.EventID, &rv.UserID, &rv.Status, &rv.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan RSVP: %w", err)
		}
		rsvps = append(rsvps, rv)
	}
	return rsvps, rows.Err()
}
