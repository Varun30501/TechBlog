package org.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BlogRestApiBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlogRestApiBackendApplication.class, args);
    }
}
