package org.blog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	// @NonNull on a METHOD PARAMETER is valid. This matches the parent interface
	// signature in Spring Framework 6 and clears the "missing non-null annotation" warning.
	@Override
	public void addCorsMappings(@NonNull CorsRegistry registry) {
		registry.addMapping("/api/blog/**")
				.allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
				.allowedHeaders("*")
				.allowCredentials(false)
				.maxAge(3600);
	}
}