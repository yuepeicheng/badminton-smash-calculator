package com.smashcalc.controller;

import com.smashcalc.model.LeaderboardEntry;
import com.smashcalc.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API endpoint for the global leaderboard.
 */
@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    /**
     * GET /api/leaderboard
     * Get the global leaderboard sorted by best smash speed.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        ArrayList<LeaderboardEntry> entries = leaderboardService.getLeaderboard();

        List<Map<String, Object>> result = new ArrayList<>();
        for (LeaderboardEntry entry : entries) {
            Map<String, Object> item = new HashMap<>();
            item.put("rank", entry.getRank());
            item.put("username", entry.getUsername());
            item.put("bestSpeedKmh", Math.round(entry.getBestSpeedKmh() * 100.0) / 100.0);
            item.put("totalSmashes", entry.getTotalSmashes());
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

}
