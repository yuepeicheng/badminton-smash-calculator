package com.smashcalc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Main entry point for the Spring Boot backend.
 * Configures CORS to allow the frontend (opened via file:// or localhost) to call the API.
 */
@SpringBootApplication
public class SmashCalcApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmashCalcApplication.class, args);
    }

    /**
     * CORS configuration — allows requests from any origin.
     * This is needed because the frontend is opened via file:// or a local server.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
    }
}
