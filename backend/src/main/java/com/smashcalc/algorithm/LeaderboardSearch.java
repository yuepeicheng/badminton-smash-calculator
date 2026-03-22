package com.smashcalc.algorithm;

import com.smashcalc.model.LeaderboardEntry;
import java.util.ArrayList;

public class LeaderboardSearch {
    public static int findByUsername(ArrayList<LeaderboardEntry> list, String username) {
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getUsername().equals(username)) {
                return i;
            }
        }
        return -1;
    }
}
