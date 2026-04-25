package db

import (
	"database/sql"
	"fmt"
	"time"

	"backend/internal/models"
)

func (db *DB) CreateStudyRequest(userID int, course, topic, availability, skillLevel string) (*models.StudyRequest, error) {
	now := time.Now()
	expires := now.Add(7 * 24 * time.Hour)
	result, err := db.conn.Exec(
		`INSERT INTO study_requests (user_id, course, topic, availability, skill_level, matched, created_at, expires_at)
		 VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
		userID, course, topic, availability, skillLevel, now, expires,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create study request: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get study request id: %w", err)
	}
	return db.GetStudyRequestByID(int(id))
}

func (db *DB) GetStudyRequestByID(id int) (*models.StudyRequest, error) {
	sr := &models.StudyRequest{}
	err := db.conn.QueryRow(
		`SELECT id, user_id, course, topic, availability, skill_level, matched, created_at, expires_at
		 FROM study_requests WHERE id = ?`, id,
	).Scan(&sr.ID, &sr.UserID, &sr.Course, &sr.Topic, &sr.Availability, &sr.SkillLevel, &sr.Matched, &sr.CreatedAt, &sr.ExpiresAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("study request not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get study request: %w", err)
	}
	return sr, nil
}

func (db *DB) ListStudyRequests() ([]*models.StudyRequest, error) {
	rows, err := db.conn.Query(
		`SELECT id, user_id, course, topic, availability, skill_level, matched, created_at, expires_at
		 FROM study_requests WHERE matched = 0 AND expires_at > ? ORDER BY created_at DESC`,
		time.Now(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list study requests: %w", err)
	}
	defer rows.Close()

	var requests []*models.StudyRequest
	for rows.Next() {
		sr := &models.StudyRequest{}
		if err := rows.Scan(&sr.ID, &sr.UserID, &sr.Course, &sr.Topic, &sr.Availability, &sr.SkillLevel, &sr.Matched, &sr.CreatedAt, &sr.ExpiresAt); err != nil {
			return nil, fmt.Errorf("failed to scan study request: %w", err)
		}
		requests = append(requests, sr)
	}
	return requests, rows.Err()
}

func (db *DB) CreateStudyGroup(course, topic string, maxMembers int) (*models.StudyGroup, error) {
	now := time.Now()
	expires := now.Add(30 * 24 * time.Hour)
	result, err := db.conn.Exec(
		`INSERT INTO study_groups (course, topic, max_members, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
		course, topic, maxMembers, now, expires,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create study group: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get study group id: %w", err)
	}
	return db.GetStudyGroupByID(int(id))
}

func (db *DB) GetStudyGroupByID(id int) (*models.StudyGroup, error) {
	sg := &models.StudyGroup{}
	err := db.conn.QueryRow(
		`SELECT id, course, topic, max_members, created_at, expires_at FROM study_groups WHERE id = ?`, id,
	).Scan(&sg.ID, &sg.Course, &sg.Topic, &sg.MaxMembers, &sg.CreatedAt, &sg.ExpiresAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("study group not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get study group: %w", err)
	}
	return sg, nil
}

func (db *DB) ListStudyGroups() ([]*models.StudyGroup, error) {
	rows, err := db.conn.Query(
		`SELECT id, course, topic, max_members, created_at, expires_at
		 FROM study_groups WHERE expires_at > ? ORDER BY created_at DESC`,
		time.Now(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list study groups: %w", err)
	}
	defer rows.Close()

	var groups []*models.StudyGroup
	for rows.Next() {
		sg := &models.StudyGroup{}
		if err := rows.Scan(&sg.ID, &sg.Course, &sg.Topic, &sg.MaxMembers, &sg.CreatedAt, &sg.ExpiresAt); err != nil {
			return nil, fmt.Errorf("failed to scan study group: %w", err)
		}
		groups = append(groups, sg)
	}
	return groups, rows.Err()
}

func (db *DB) JoinStudyGroup(groupID, userID int) error {
	_, err := db.conn.Exec(
		`INSERT OR IGNORE INTO study_group_members (study_group_id, user_id, joined_at) VALUES (?, ?, ?)`,
		groupID, userID, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to join study group: %w", err)
	}
	return nil
}

func (db *DB) GetStudyGroupMembers(groupID int) ([]*models.StudyGroupMember, error) {
	rows, err := db.conn.Query(
		`SELECT sgm.id, sgm.study_group_id, sgm.user_id, COALESCE(u.name, 'Unknown') as user_name, sgm.joined_at FROM study_group_members sgm LEFT JOIN users u ON u.id = sgm.user_id WHERE sgm.study_group_id = ?`, groupID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get study group members: %w", err)
	}
	defer rows.Close()

	var members []*models.StudyGroupMember
	for rows.Next() {
		m := &models.StudyGroupMember{}
		if err := rows.Scan(&m.ID, &m.StudyGroupID, &m.UserID, &m.UserName, &m.JoinedAt); err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

// LeaveStudyGroup removes a user from a study group
func (db *DB) LeaveStudyGroup(groupID, userID int) error {
	result, err := db.conn.Exec(
		`DELETE FROM study_group_members WHERE study_group_id = ? AND user_id = ?`,
		groupID, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to leave study group: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("not a member of this study group")
	}
	return nil
}
