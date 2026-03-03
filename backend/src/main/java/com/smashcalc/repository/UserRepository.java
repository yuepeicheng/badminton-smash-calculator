package com.smashcalc.repository;

import com.smashcalc.model.RegularUser;
import com.smashcalc.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * Handles all database operations for users.
 * Uses raw JDBC (JdbcTemplate) to demonstrate SQL knowledge.
 */
@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Map a database row to a User object.
     * Creates RegularUser based on the user_type column.
     */
    private User mapRowToUser(ResultSet rs, int rowNum) throws SQLException {
        RegularUser user = new RegularUser();
        user.setId(rs.getInt("id"));
        user.setUsername(rs.getString("username"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setDisplayName(rs.getString("display_name"));
        user.setCreatedAt(rs.getString("created_at"));
        return user;
    }

    /**
     * Find a user by their username.
     */
    public User findByUsername(String username) {
        String sql = "SELECT * FROM users WHERE username = ?";
        List<User> users = jdbcTemplate.query(sql, this::mapRowToUser, username);
        return users.isEmpty() ? null : users.get(0);
    }

    /**
     * Find a user by their ID.
     */
    public User findById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        List<User> users = jdbcTemplate.query(sql, this::mapRowToUser, id);
        return users.isEmpty() ? null : users.get(0);
    }

    /**
     * Check if a username already exists.
     */
    public boolean existsByUsername(String username) {
        String sql = "SELECT COUNT(*) FROM users WHERE username = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username);
        return count != null && count > 0;
    }

    /**
     * Save a new user to the database. Returns the generated ID.
     */
    public int save(User user) {
        String sql = "INSERT INTO users (username, password_hash, display_name, user_type) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getPasswordHash());
            ps.setString(3, user.getDisplayName());
            ps.setString(4, user.getUserType());
            return ps;
        }, keyHolder);

        return keyHolder.getKey().intValue();
    }
}
