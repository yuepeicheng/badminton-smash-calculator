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
        ArrayList<LeaderboardEntry> entries = recordRepository.getLeaderboardData();
        // NOT Collections.sort
        entries = MergeSortAlgorithm.sort(entries);

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    /**
     * Find a specific user's rank using binary search on the sorted leaderboard.
     * Returns the 1-based rank, or -1 if user has no records.
     */
    public int getUserRank(String username) {
        ArrayList<LeaderboardEntry> leaderboard = getLeaderboard();

        int index = BinarySearch.findByUsername(leaderboard, username);

        if (index == -1) {
            return -1;
        }

        return index + 1;
    }

    /**
     * Find where a given speed would rank on the leaderboard using binary search.
     * Returns the 1-based projected rank (e.g. 1 = fastest).
     */
    public int getRankForSpeed(double speedKmh) {
        ArrayList<LeaderboardEntry> sorted = getLeaderboard();
        int insertionPoint = BinarySearch.findRankForSpeed(sorted, speedKmh);
        return insertionPoint + 1;
    }
}
