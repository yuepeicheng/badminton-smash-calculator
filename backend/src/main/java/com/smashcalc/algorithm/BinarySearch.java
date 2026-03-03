package com.smashcalc.algorithm;

import com.smashcalc.model.LeaderboardEntry;
import java.util.ArrayList;

/**
 * Hand-written binary search for finding a user's rank in the leaderboard.
 *
 * Time complexity: O(log n)
 * Works on a list that is already sorted in descending order by speed.
 *
 * This is implemented manually to demonstrate understanding of the
 * binary search algorithm and its O(log n) efficiency over linear search.
 */
public class BinarySearch {

    /**
     * Find where a given speed would rank in a descending-sorted leaderboard.
     * Returns the 0-based index (rank position).
     *
     * For example, if the leaderboard speeds are [300, 250, 200, 150]
     * and speedKmh = 225, this returns 2 (would be rank 3, between 250 and 200).
     */
    public static int findRankForSpeed(ArrayList<LeaderboardEntry> sortedDescending, double speedKmh) {
        int low = 0;
        int high = sortedDescending.size();

        while (low < high) {
            int mid = (low + high) / 2;

            if (sortedDescending.get(mid).getBestSpeedKmh() >= speedKmh) {
                // The midpoint speed is still >= our speed, so our rank is lower (further right)
                low = mid + 1;
            } else {
                // The midpoint speed is less than ours, so our rank is here or higher (further left)
                high = mid;
            }
        }

        return low; // This is the 0-based rank position
    }

    /**
     * Find a specific username in the sorted leaderboard.
     * Since the list is sorted by speed (not name), this uses linear search.
     * Returns the 0-based index or -1 if not found.
     */
    public static int findByUsername(ArrayList<LeaderboardEntry> list, String username) {
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getUsername().equals(username)) {
                return i;
            }
        }
        return -1;
    }
}
