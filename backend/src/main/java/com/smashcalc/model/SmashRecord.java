package com.smashcalc.model;

/**
 * Represents a single smash speed measurement.
 * Demonstrates: encapsulation (private fields with getters/setters).
 */
public class SmashRecord {
    private int id;
    private int userId;
    private double speedMps;
    private String recordedAt;

    public SmashRecord() {}

    public SmashRecord(int userId, double speedMps) {
        this.userId = userId;
        this.speedMps = speedMps;
    }

    // Computed property: convert m/s to km/h
    public double getSpeedKmh() {
        return speedMps * 3.6;
    }

    // Getters and setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public double getSpeedMps() { return speedMps; }
    public void setSpeedMps(double speedMps) { this.speedMps = speedMps; }

    public String getRecordedAt() { return recordedAt; }
    public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
}
