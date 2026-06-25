package org.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	// Comma-separated list, configurable per environment via app.cors.allowed-origins
	// (env var: APP_CORS_ALLOWED_ORIGINS). Defaults cover local dev only — add your
	// real frontend URL here for production (e.g. https://yourblog.com), unless
	// frontend and backend are served from the same origin behind a reverse proxy,
	// in which case CORS isn't exercised at all and this can stay as-is.
	@Value("${app.cors.allowed-origins:http://localhost:4200,http://127.0.0.1:4200}")
	private String allowedOrigins;

	// @NonNull on a METHOD PARAMETER is valid. This matches the parent interface
	// signature in Spring Framework 6 and clears the "missing non-null annotation" warning.
	@Override
	public void addCorsMappings(@NonNull CorsRegistry registry) {
		registry.addMapping("/api/blog/**")
				.allowedOrigins(allowedOrigins.split("\\s*,\\s*"))
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
				.allowedHeaders("*")
				.allowCredentials(false)
				.maxAge(3600);
	}
}