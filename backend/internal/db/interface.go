package db

import (
	"time"
	"backend/internal/models"
)

type Database interface {
	CreateUser(email, passwordHash, name, role string) (*models.User, error)
	GetUserByID(id int) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	UpdateUser(id int, name, role string) error
	DeleteUser(id int) error
	CreatePost(userID int, content, tags string) (*models.Post, error)
	GetPostByID(id int) (*models.Post, error)
	GetAllPosts(limit, offset int) ([]*models.Post, error)
	UpdatePost(id int, content, tags string) error
	DeletePost(id int) error
	LikePost(id int) error
	CreateStudent(name, email, major string, year int) (int64, error)
	ListStudents() ([]StudentRow, error)
	GetStudent(id int) (*StudentRow, error)
	UpdateStudent(id int, name, email, major string, year int) error
	DeleteStudent(id int) error
	CreateClub(name, description string, createdBy int) (*models.Club, error)
	GetClubByID(id int) (*models.Club, error)
	ListClubs() ([]*models.Club, error)
	JoinClub(clubID, userID int, role string) error
	LeaveClub(clubID, userID int) error
	GetClubMembers(clubID int) ([]*models.ClubMember, error)
	CreateEvent(clubID, creatorID int, title, description, location string, date time.Time, capacity int) (*models.Event, error)
	GetEventByID(id int) (*models.Event, error)
	ListEvents(clubID int) ([]*models.Event, error)
	RSVPEvent(eventID, userID int, status string) error
	GetRSVPs(eventID int) ([]*models.RSVP, error)
	CreateStudyRequest(userID int, course, topic, availability, skillLevel string) (*models.StudyRequest, error)
	ListStudyRequests() ([]*models.StudyRequest, error)
	CreateStudyGroup(course, topic string, maxMembers int) (*models.StudyGroup, error)
	GetStudyGroupByID(id int) (*models.StudyGroup, error)
	ListStudyGroups() ([]*models.StudyGroup, error)
	JoinStudyGroup(groupID, userID int) error
	GetStudyGroupMembers(groupID int) ([]*models.StudyGroupMember, error)
}
