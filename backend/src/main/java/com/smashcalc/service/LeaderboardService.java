package com.smashcalc.service;

import com.smashcalc.algorithm.MergeSortAlgorithm;
import com.smashcalc.model.LeaderboardEntry;
import com.smashcalc.repository.SmashRecordRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * Handles leaderboard logic using custom sorting and searching algorithms.
 * This is where the hand-written merge sort and linear search are used.
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
        entries = MergeSortAlgorithm.sort(entries);

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

}
