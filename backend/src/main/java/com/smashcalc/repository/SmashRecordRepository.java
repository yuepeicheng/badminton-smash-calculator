package com.smashcalc.repository;

import com.smashcalc.model.LeaderboardEntry;
import com.smashcalc.model.SmashRecord;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles all database operations for smash records.
 * Uses raw JDBC (JdbcTemplate) to demonstrate SQL knowledge.
 */
@Repository
public class SmashRecordRepository {

    private final JdbcTemplate jdbcTemplate;

    public SmashRecordRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Map a database row to a SmashRecord object.
     */
    private SmashRecord mapRowToRecord(ResultSet rs, int rowNum) throws SQLException {
        SmashRecord record = new SmashRecord();
        record.setId(rs.getInt("id"));
        record.setUserId(rs.getInt("user_id"));
        record.setSpeedMps(rs.getDouble("speed_mps"));
        record.setRecordedAt(rs.getString("recorded_at"));
        return record;
    }

    /**
     * Get all records for a specific user, ordered by date ascending.
     */
    public ArrayList<SmashRecord> findByUserId(int userId) {
        String sql = "SELECT * FROM smash_records WHERE user_id = ? ORDER BY recorded_at ASC";
        List<SmashRecord> records = jdbcTemplate.query(sql, this::mapRowToRecord, userId);
        return new ArrayList<>(records);
    }

    /**
     * Save a new smash record. Returns the generated ID.
     */
    public int save(SmashRecord record) {
        String sql = "INSERT INTO smash_records (user_id, speed_mps) VALUES (?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setInt(1, record.getUserId());
            ps.setDouble(2, record.getSpeedMps());
            return ps;
        }, keyHolder);

        return keyHolder.getKey().intValue();
    }

    /**
     * Delete a record by ID.
     */
    public void deleteById(int id) {
        String sql = "DELETE FROM smash_records WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    /**
     * Find a record by ID.
     */
    public SmashRecord findById(int id) {
        String sql = "SELECT * FROM smash_records WHERE id = ?";
        List<SmashRecord> records = jdbcTemplate.query(sql, this::mapRowToRecord, id);
        return records.isEmpty() ? null : records.get(0);
    }

    /**
     * Get leaderboard data: each user's best speed and total smash count.
     * Uses SQL GROUP BY with MAX aggregate function.
     */
    public ArrayList<LeaderboardEntry> getLeaderboardData() {
        String sql = "SELECT u.username, MAX(s.speed_mps) * 3.6 AS best_speed_kmh, COUNT(*) AS total_smashes "
                   + "FROM smash_records s "
                   + "JOIN users u ON s.user_id = u.id "
                   + "GROUP BY s.user_id";

        List<LeaderboardEntry> entries = jdbcTemplate.query(sql, (rs, rowNum) ->
            new LeaderboardEntry(
                rs.getString("username"),
                rs.getDouble("best_speed_kmh"),
                rs.getInt("total_smashes")
            )
        );

        return new ArrayList<>(entries);
    }
}
