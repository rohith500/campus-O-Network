package db

import (
	"database/sql"
	"fmt"
	"time"

	"backend/internal/models"
)

func (db *DB) CreateClub(name, description string, createdBy int) (*models.Club, error) {
	now := time.Now()
	result, err := db.conn.Exec(
		`INSERT INTO clubs (name, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
		name, description, createdBy, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create club: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get club id: %w", err)
	}
	return db.GetClubByID(int(id))
}

func (db *DB) GetClubByID(id int) (*models.Club, error) {
	club := &models.Club{}
	err := db.conn.QueryRow(
		`SELECT id, name, description, created_at, updated_at FROM clubs WHERE id = ?`, id,
	).Scan(&club.ID, &club.Name, &club.Description, &club.CreatedAt, &club.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("club not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get club: %w", err)
	}
	return club, nil
}

func (db *DB) ListClubs() ([]*models.Club, error) {
	rows, err := db.conn.Query(
		`SELECT id, name, description, created_at, updated_at FROM clubs ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list clubs: %w", err)
	}
	defer rows.Close()

	var clubs []*models.Club
	for rows.Next() {
		club := &models.Club{}
		if err := rows.Scan(&club.ID, &club.Name, &club.Description, &club.CreatedAt, &club.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan club: %w", err)
		}
		clubs = append(clubs, club)
	}
	return clubs, rows.Err()
}

func (db *DB) JoinClub(clubID, userID int, role string) error {
	_, err := db.conn.Exec(
		`INSERT OR IGNORE INTO club_members (club_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)`,
		clubID, userID, role, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to join club: %w", err)
	}
	return nil
}

func (db *DB) LeaveClub(clubID, userID int) error {
	result, err := db.conn.Exec(
		`DELETE FROM club_members WHERE club_id = ? AND user_id = ?`, clubID, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to leave club: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("membership not found")
	}
	return nil
}

func (db *DB) GetClubMembers(clubID int) ([]*models.ClubMember, error) {
	rows, err := db.conn.Query(
		`SELECT cm.id, cm.club_id, cm.user_id, COALESCE(u.name, 'Unknown') as user_name, cm.role, cm.joined_at FROM club_members cm LEFT JOIN users u ON u.id = cm.user_id WHERE cm.club_id = ?`, clubID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get club members: %w", err)
	}
	defer rows.Close()

	var members []*models.ClubMember
	for rows.Next() {
		m := &models.ClubMember{}
		if err := rows.Scan(&m.ID, &m.ClubID, &m.UserID, &m.UserName, &m.Role, &m.JoinedAt); err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}
		members = append(members, m)
	}
	return members, rows.Err()
}
