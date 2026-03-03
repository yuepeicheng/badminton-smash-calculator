package com.smashcalc.model;

/**
 * Regular user — can only delete their own records.
 * Demonstrates: inheritance (extends User), polymorphism (overrides abstract methods).
 */
public class RegularUser extends User {

    public RegularUser() {
        super();
    }

    public RegularUser(String username, String passwordHash, String displayName) {
        super(username, passwordHash, displayName);
    }

    @Override
    public String getUserType() {
        return "regular";
    }

    @Override
    public boolean canDeleteRecords(int targetUserId) {
        // Regular users can only delete their own records
        return this.getId() == targetUserId;
    }
}
