package com.smashcalc.service;

import com.smashcalc.algorithm.BinarySearch;
import com.smashcalc.algorithm.MergeSortAlgorithm;
import com.smashcalc.model.LeaderboardEntry;
import com.smashcalc.repository.SmashRecordRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * Handles leaderboard logic using custom sorting and searching algorithms.
 * This is where the hand-written merge sort and binary search are used.
 */
@Service
public class LeaderboardService {

    private final SmashRecordRepository recordRepository;

    public LeaderboardService(SmashRecordRepository recordRepository) {
        this.recordRepository = recordRepository;
    }

    /**
     * Get the global leaderboard, sorted by best speed using merge sort.
     * Each user appears once with their best (fastest) smash.
     */
    public ArrayList<LeaderboardEntry> getLeaderboard() {
        // 1. Fetch raw leaderboard data from database (unsorted)
        ArrayList<LeaderboardEntry> entries = recordRepository.getLeaderboardData();

        // 2. Sort using our hand-written merge sort algorithm (NOT Collections.sort)
        entries = MergeSortAlgorithm.sort(entries);

        // 3. Assign rank numbers after sorting
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1); // 1-based rank
        }

        return entries;
    }

    /**
     * Find a specific user's rank using binary search on the sorted leaderboard.
     * Returns the 1-based rank, or -1 if user has no records.
     */
    public int getUserRank(String username) {
        ArrayList<LeaderboardEntry> leaderboard = getLeaderboard();

        // Use binary search to find the user's position
        int index = BinarySearch.findByUsername(leaderboard, username);

        if (index == -1) {
            return -1; // User not found in leaderboard
        }

        return index + 1; // Convert 0-based index to 1-based rank
    }
}
