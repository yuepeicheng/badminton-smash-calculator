package com.smashcalc.model;

/**
 * Abstract base class for all user types.
 * Demonstrates: inheritance (subclasses extend this), encapsulation (private fields).
 */
public abstract class User {
    private int id;
    private String username;
    private String passwordHash;
    private String displayName;
    private String createdAt;

    public User() {}

    public User(String username, String passwordHash, String displayName) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
    }

    // Abstract methods — subclasses must implement (polymorphism)
    public abstract String getUserType();
    public abstract boolean canDeleteRecords(int targetUserId);

    // Getters and setters (encapsulation)
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
