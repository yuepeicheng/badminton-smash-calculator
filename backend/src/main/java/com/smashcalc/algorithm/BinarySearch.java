package com.smashcalc.algorithm;

import com.smashcalc.model.LeaderboardEntry;
import java.util.ArrayList;

public class BinarySearch {
    public static int findRankForSpeed(ArrayList<LeaderboardEntry> sortedDescending, double speedKmh) {
        int low = 0;
        int high = sortedDescending.size();

        while (low < high) {
            int mid = (low + high) / 2;

            if (sortedDescending.get(mid).getBestSpeedKmh() >= speedKmh) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        return low;
    }
    
    public static int findByUsername(ArrayList<LeaderboardEntry> list, String username) {
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getUsername().equals(username)) {
                return i;
            }
        }
        return -1;
    }
}
