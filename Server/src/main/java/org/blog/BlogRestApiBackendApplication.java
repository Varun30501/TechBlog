package org.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BlogRestApiBackendApplication {
    public static void main(String[] args) {
        // ── TEMPORARY DIAGNOSTIC — remove once the DB connection issue is resolved ──
        // Prints exactly what DB_URL resolves to at runtime. Safe to log: this app's
        // DB_URL never has the password embedded in it (username/password are
        // separate env vars), so nothing sensitive ends up in the deploy logs.
        System.out.println("=== DIAGNOSTIC: DB_URL env var seen by the app = ["
                + System.getenv("DB_URL") + "]");
        SpringApplication.run(BlogRestApiBackendApplication.class, args);
    }
}