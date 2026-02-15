-- +goose Up
CREATE TABLE clubs_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- member, ambassador
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clubs_members_club_id ON clubs_members(club_id);
CREATE INDEX idx_clubs_members_user_id ON clubs_members(user_id);

-- +goose Down
DROP TABLE clubs_members;
