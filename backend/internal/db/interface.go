package db

import (
	"time"

	"backend/internal/models"
)

type Database interface {
	// Users
	CreateUser(email, passwordHash, name, role string) (*models.User, error)
	GetUserByID(id int) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	UpdateUser(id int, name, role string) error
	DeleteUser(id int) error

	// Posts
	CreatePost(userID int, content, tags string) (*models.Post, error)
	GetPostByID(id int) (*models.Post, error)
	GetAllPosts(limit, offset int) ([]*models.Post, error)
	UpdatePost(id int, content, tags string) error
	DeletePost(id int) error
	LikePost(id int) error

	// Comments (Sprint 3)
	CreateComment(postID, userID int, content string) (*models.Comment, error)
	GetCommentByID(id int) (*models.Comment, error)
	GetCommentsByPostID(postID int) ([]*models.Comment, error)
	DeleteComment(commentID, userID int) error

	// Students
	CreateStudent(name, email, major string, year int) (int64, error)
	ListStudents() ([]StudentRow, error)
	GetStudent(id int) (*StudentRow, error)
	UpdateStudent(id int, name, email, major string, year int) error
	DeleteStudent(id int) error

	// Profiles (Sprint 3)
	GetProfileByUserID(userID int) (*models.UserProfile, error)
	UpsertProfile(userID int, bio, interests, availability, skillLevel string) (*models.UserProfile, error)

	// Clubs
	CreateClub(name, description string, createdBy int) (*models.Club, error)
	GetClubByID(id int) (*models.Club, error)
	ListClubs() ([]*models.Club, error)
	JoinClub(clubID, userID int, role string) error
	LeaveClub(clubID, userID int) error
	GetClubMembers(clubID int) ([]*models.ClubMember, error)

	// Events
	CreateEvent(clubID, creatorID int, title, description, location string, date time.Time, capacity int) (*models.Event, error)
	GetEventByID(id int) (*models.Event, error)
	ListEvents(clubID int) ([]*models.Event, error)
	RSVPEvent(eventID, userID int, status string) error
	GetRSVPs(eventID int) ([]*models.RSVP, error)

	// Study Groups
	CreateStudyRequest(userID int, course, topic, availability, skillLevel string) (*models.StudyRequest, error)
	ListStudyRequests() ([]*models.StudyRequest, error)
	CreateStudyGroup(course, topic string, maxMembers int) (*models.StudyGroup, error)
	GetStudyGroupByID(id int) (*models.StudyGroup, error)
	ListStudyGroups() ([]*models.StudyGroup, error)
	JoinStudyGroup(groupID, userID int) error
	GetStudyGroupMembers(groupID int) ([]*models.StudyGroupMember, error)
}
