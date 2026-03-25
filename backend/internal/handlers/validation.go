package handlers

import "strings"

// isBlank returns true if the string is empty after trimming whitespace
func isBlank(s string) bool {
	return strings.TrimSpace(s) == ""
}

// truncate shortens a string to max length if needed
func truncate(s string, max int) string {
	s = strings.TrimSpace(s)
	if len(s) > max {
		return s[:max]
	}
	return s
}
