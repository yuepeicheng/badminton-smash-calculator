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

/**
 * REST API endpoints for smash records.
 */
@RestController
@RequestMapping("/api/records")
public class SmashController {

    private final SmashService smashService;
    private final AuthService authService;

    public SmashController(SmashService smashService, AuthService authService) {
        this.smashService = smashService;
        this.authService = authService;
    }

    /**
     * POST /api/records
     * Save a new smash speed record for the logged-in user.
     */
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

    /**
     * GET /api/records
     * Get the logged-in user's smash history.
     */
    @GetMapping
    public ResponseEntity<?> getRecords(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {

        User user = authService.getUserFromSession(sessionId);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Not logged in"));
        }

        ArrayList<SmashRecord> records = smashService.getHistory(user.getId());

        // Convert to list of maps for JSON response
        List<Map<String, Object>> result = new ArrayList<>();
        for (SmashRecord r : records) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("speedMps", r.getSpeedMps());
            item.put("speedKmh", r.getSpeedKmh());
            item.put("recordedAt", r.getRecordedAt());
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/records/progression
     * Get the logged-in user's speed data formatted for Chart.js.
     */
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

    /**
     * DELETE /api/records/{id}
     * Delete a specific smash record (only own records for regular users).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecord(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @PathVariable int id) {

        User user = authService.getUserFromSession(sessionId);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Not logged in"));
        }

        SmashRecord record = smashService.findById(id);
        if (record == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "error", "Record not found"));
        }

        // Check permission using polymorphic canDeleteRecords method
        if (!user.canDeleteRecords(record.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("success", false, "error", "Not authorized"));
        }

        smashService.deleteRecord(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
