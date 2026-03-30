package com.smashcalc.algorithm;

import com.smashcalc.model.LeaderboardEntry;
import java.util.ArrayList;

public class MergeSortAlgorithm {
    public static ArrayList<LeaderboardEntry> sort(ArrayList<LeaderboardEntry> list) {
        if (list.size() <= 1) {
            return list;
        }

        int mid = list.size() / 2;
        ArrayList<LeaderboardEntry> left = new ArrayList<>(list.subList(0, mid));
        ArrayList<LeaderboardEntry> right = new ArrayList<>(list.subList(mid, list.size()));

        left = sort(left);
        right = sort(right);

        return merge(left, right);
    }

    private static ArrayList<LeaderboardEntry> merge(
            ArrayList<LeaderboardEntry> left,
            ArrayList<LeaderboardEntry> right) {

        ArrayList<LeaderboardEntry> result = new ArrayList<>();
        int i = 0;
        int j = 0;

        while (i < left.size() && j < right.size()) {
            if (left.get(i).getBestSpeedKmh() >= right.get(j).getBestSpeedKmh()) {
                result.add(left.get(i));
                i++;
            } else {
                result.add(right.get(j));
                j++;
            }
        }
        while (i < left.size()) {
            result.add(left.get(i));
            i++;
        }

        while (j < right.size()) {
            result.add(right.get(j));
            j++;
        }

        return result;
    }
}
