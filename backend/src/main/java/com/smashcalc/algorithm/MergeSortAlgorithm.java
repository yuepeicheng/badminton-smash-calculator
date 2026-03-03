package com.smashcalc.algorithm;

import com.smashcalc.model.LeaderboardEntry;
import java.util.ArrayList;

/**
 * Hand-written merge sort algorithm for sorting leaderboard entries.
 * Sorts in descending order by best smash speed (highest first).
 *
 * Time complexity: O(n log n)
 * Space complexity: O(n)
 *
 * This is implemented manually (not using Collections.sort) to demonstrate
 * understanding of the divide-and-conquer sorting approach.
 */
public class MergeSortAlgorithm {

    /**
     * Sort a list of leaderboard entries by speed (descending).
     * Uses recursive merge sort: split in half, sort each half, merge.
     */
    public static ArrayList<LeaderboardEntry> sort(ArrayList<LeaderboardEntry> list) {
        // Base case: a list of 0 or 1 elements is already sorted
        if (list.size() <= 1) {
            return list;
        }

        // Split the list into two halves
        int mid = list.size() / 2;
        ArrayList<LeaderboardEntry> left = new ArrayList<>(list.subList(0, mid));
        ArrayList<LeaderboardEntry> right = new ArrayList<>(list.subList(mid, list.size()));

        // Recursively sort each half
        left = sort(left);
        right = sort(right);

        // Merge the two sorted halves
        return merge(left, right);
    }

    /**
     * Merge two sorted lists into one sorted list (descending by speed).
     */
    private static ArrayList<LeaderboardEntry> merge(
            ArrayList<LeaderboardEntry> left,
            ArrayList<LeaderboardEntry> right) {

        ArrayList<LeaderboardEntry> result = new ArrayList<>();
        int i = 0; // pointer for left list
        int j = 0; // pointer for right list

        // Compare elements from both lists and add the larger one first
        while (i < left.size() && j < right.size()) {
            if (left.get(i).getBestSpeedKmh() >= right.get(j).getBestSpeedKmh()) {
                result.add(left.get(i));
                i++;
            } else {
                result.add(right.get(j));
                j++;
            }
        }

        // Add remaining elements from left list
        while (i < left.size()) {
            result.add(left.get(i));
            i++;
        }

        // Add remaining elements from right list
        while (j < right.size()) {
            result.add(right.get(j));
            j++;
        }

        return result;
    }
}
