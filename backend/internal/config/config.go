package config

import (
	"os"
)

type Config struct {
	Port   string
	DBType string // "sqlite" or "postgres"
	DBPath string // for SQLite: path to .db file
	DBHost string
	DBPort string
	DBName string
	DBUser string
	DBPass string
	JWTKey string
	AppEnv string
}

func Load() *Config {
	dbType := getEnv("DB_TYPE", "sqlite") // default to SQLite

	return &Config{
		Port:   getEnv("PORT", "8080"),
		DBType: dbType,
		DBPath: getEnv("DB_PATH", "./data/campus_o_network.db"), // SQLite file path
		DBHost: getEnv("DB_HOST", "localhost"),
		DBPort: getEnv("DB_PORT", "5432"),
		DBName: getEnv("DB_NAME", "campus_o_network"),
		DBUser: getEnv("DB_USER", "postgres"),
		DBPass: getEnv("DB_PASS", "password"),
		JWTKey: getEnv("JWT_KEY", "your-secret-key"),
		AppEnv: getEnv("APP_ENV", "development"),
	}
}

func getEnv(key string, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}
