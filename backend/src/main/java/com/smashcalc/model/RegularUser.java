package com.smashcalc.model;

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
