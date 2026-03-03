package com.smashcalc.service;

import com.smashcalc.model.SmashRecord;
import com.smashcalc.repository.SmashRecordRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * Handles saving and retrieving smash speed records.
 */
@Service
public class SmashService {

    private final SmashRecordRepository recordRepository;

    public SmashService(SmashRecordRepository recordRepository) {
        this.recordRepository = recordRepository;
    }

    /**
     * Save a new smash record for a user.
     */
    public SmashRecord saveSmash(int userId, double speedMps) {
        // Validate speed
        if (speedMps <= 0) {
            throw new IllegalArgumentException("Speed must be greater than 0");
        }
        if (speedMps > 200) {
            throw new IllegalArgumentException("Speed exceeds physically possible range (200 m/s)");
        }

        SmashRecord record = new SmashRecord(userId, speedMps);
        int id = recordRepository.save(record);
        record.setId(id);

        // Re-fetch to get the auto-generated timestamp
        return recordRepository.findById(id);
    }

    /**
     * Get a user's smash history ordered by date (for progression chart).
     */
    public ArrayList<SmashRecord> getHistory(int userId) {
        return recordRepository.findByUserId(userId);
    }

    /**
     * Delete a smash record by ID.
     */
    public void deleteRecord(int recordId) {
        recordRepository.deleteById(recordId);
    }

    /**
     * Find a record by ID.
     */
    public SmashRecord findById(int id) {
        return recordRepository.findById(id);
    }
}
