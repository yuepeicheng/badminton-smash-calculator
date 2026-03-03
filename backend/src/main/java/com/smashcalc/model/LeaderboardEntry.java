package com.smashcalc.model;

/**
 * Data transfer object for leaderboard display.
 * Implements Comparable for use with sorting algorithms.
 */
public class LeaderboardEntry implements Comparable<LeaderboardEntry> {
    private String username;
    private double bestSpeedKmh;
    private int totalSmashes;
    private int rank;

    public LeaderboardEntry(String username, double bestSpeedKmh, int totalSmashes) {
        this.username = username;
        this.bestSpeedKmh = bestSpeedKmh;
        this.totalSmashes = totalSmashes;
    }

    @Override
    public int compareTo(LeaderboardEntry other) {
        // Sort descending by speed (highest first)
        return Double.compare(other.bestSpeedKmh, this.bestSpeedKmh);
    }

    // Getters and setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public double getBestSpeedKmh() { return bestSpeedKmh; }
    public void setBestSpeedKmh(double bestSpeedKmh) { this.bestSpeedKmh = bestSpeedKmh; }

    public int getTotalSmashes() { return totalSmashes; }
    public void setTotalSmashes(int totalSmashes) { this.totalSmashes = totalSmashes; }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
}
