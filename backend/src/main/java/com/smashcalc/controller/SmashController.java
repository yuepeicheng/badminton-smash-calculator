package com.smashcalc.controller;

import com.smashcalc.model.SmashRecord;
import com.smashcalc.model.User;
import com.smashcalc.service.AuthService;
import com.smashcalc.service.SmashService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/records")
public class SmashController {

    private final SmashService smashService;
    private final AuthService authService;

    public SmashController(SmashService smashService, AuthService authService) {
        this.smashService = smashService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveRecord(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestBody Map<String, Object> body) {

        User user = authService.getUserFromSession(sessionId);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Not logged in"));
        }

        try {
            double speedMps = ((Number) body.get("speedMps")).doubleValue();
            SmashRecord record = smashService.saveSmash(user.getId(), speedMps);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", record.getId());
            response.put("speedMps", record.getSpeedMps());
            response.put("speedKmh", record.getSpeedKmh());
            response.put("recordedAt", record.getRecordedAt());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/progression")
    public ResponseEntity<?> getProgression(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {

        User user = authService.getUserFromSession(sessionId);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Not logged in"));
        }

        ArrayList<SmashRecord> records = smashService.getHistory(user.getId());

        // Format for Chart.js: [{date, speedKmh}]
        List<Map<String, Object>> result = new ArrayList<>();
        for (SmashRecord r : records) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", r.getRecordedAt());
            point.put("speedKmh", r.getSpeedKmh());
            result.add(point);
        }

        return ResponseEntity.ok(result);
    }
}
