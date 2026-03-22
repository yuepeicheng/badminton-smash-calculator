package com.smashcalc.service;

import com.smashcalc.model.RegularUser;
import com.smashcalc.model.User;
import com.smashcalc.repository.UserRepository;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final HashMap<String, Integer> activeSessions = new HashMap<>();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String register(String username, String password, String displayName) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (displayName == null || displayName.trim().isEmpty()) {
            displayName = username;
        }

        if (userRepository.existsByUsername(username.trim())) {
            throw new IllegalArgumentException("Username already taken");
        }

        String passwordHash = hashPassword(password);

        RegularUser user = new RegularUser(username.trim(), passwordHash, displayName.trim());
        int userId = userRepository.save(user);
        user.setId(userId);

        // Auto-login: create session
        return createSession(userId);
    }

    public String login(String username, String password) {
        if (username == null || password == null) {
            throw new IllegalArgumentException("Username and password are required");
        }

        User user = userRepository.findByUsername(username.trim());
        if (user == null) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        if (!verifyPassword(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return createSession(user.getId());
    }

    private String createSession(int userId) {
        String sessionId = UUID.randomUUID().toString();
        activeSessions.put(sessionId, userId);
        return sessionId;
    }

    /**
     * Get user from session ID. Checks the HashMap cache first.
     * Returns null if session is invalid.
     */
    public User getUserFromSession(String sessionId) {
        if (sessionId == null || sessionId.isEmpty()) {
            return null;
        }

        Integer userId = activeSessions.get(sessionId);
        if (userId == null) {
            return null;
        }

        return userRepository.findById(userId);
    }

    /**
     * Logout: remove session from cache.
     */
    public void logout(String sessionId) {
        activeSessions.remove(sessionId);
    }

    /**
     * Hash a password using PBKDF2 with a random salt.
     * Uses Java's built-in crypto libraries (no external dependencies).
     */
    private String hashPassword(String password) {
        try {
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[16];
            random.nextBytes(salt);

            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 10000, 256);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();

            String saltStr = Base64.getEncoder().encodeToString(salt);
            String hashStr = Base64.getEncoder().encodeToString(hash);
            return saltStr + ":" + hashStr;
        } catch (Exception e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    /**
     * Verify a password against a stored hash.
     */
    private boolean verifyPassword(String password, String storedHash) {
        try {
            String[] parts = storedHash.split(":");
            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[1]);

            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 10000, 256);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] actualHash = factory.generateSecret(spec).getEncoded();

            if (actualHash.length != expectedHash.length) {
                return false;
            }
            int result = 0;
            for (int i = 0; i < actualHash.length; i++) {
                result |= actualHash[i] ^ expectedHash[i];
            }
            return result == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
