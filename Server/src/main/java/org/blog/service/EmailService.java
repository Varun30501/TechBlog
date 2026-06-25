package org.blog.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Sends transactional emails (currently just password-reset links) over
 * a plain HTTPS API call rather than raw SMTP.
 *
 * WHY HTTP INSTEAD OF SMTP: most managed hosts (Render, Railway, Heroku,
 * Vercel, many corporate networks, etc.) block or heavily throttle
 * outbound SMTP ports (25/465/587) by default, so an SMTP-based mailer
 * that works fine on localhost often silently fails in production. An
 * HTTPS API call goes out over port 443 like any other outbound request,
 * so it isn't subject to that restriction.
 *
 * This implementation targets Resend (https://resend.com) because its API
 * is a single JSON POST with no SDK required, but the same pattern works
 * for SendGrid, Mailgun, Postmark, Brevo, etc. — just change the URL,
 * auth header, and request body shape in sendViaApi().
 *
 * If app.email.api-key isn't set (e.g. local development before you've
 * created a provider account), the call is skipped and the reset link is
 * logged to the console instead, so the flow stays testable end-to-end
 * without needing email at all.
 */
@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);
	private static final URI RESEND_ENDPOINT = URI.create("https://api.resend.com/emails");

	private final HttpClient httpClient = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(10))
			.build();
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Value("${app.email.api-key:}")
	private String apiKey;

	@Value("${app.email.from:TechBlog <onboarding@resend.dev>}")
	private String fromAddress;

	@Value("${app.frontend-url:http://localhost:4200}")
	private String frontendUrl;

	public void sendPasswordResetEmail(String toEmail, String token) {
		String resetLink = frontendUrl + "/reset-password?token=" + token;
		String subject = "Reset your TechBlog password";
		String body = "We received a request to reset your TechBlog password.\n\n"
				+ "Click the link below to choose a new password. This link expires in 30 minutes.\n\n"
				+ resetLink + "\n\n"
				+ "If you didn't request this, you can safely ignore this email.";

		if (apiKey == null || apiKey.isBlank()) {
			log.warn("app.email.api-key is not configured — skipping send and logging the link instead. "
					+ "Reset link for {}: {}", toEmail, resetLink);
			return;
		}

		try {
			sendViaApi(toEmail, subject, body);
		} catch (Exception e) {
			// Network hiccup, bad API key, provider outage, etc. Never let an email
			// failure break the reset flow itself — fall back to logging the link.
			log.warn("Password reset email to {} could not be sent ({}). Reset link: {}",
					toEmail, e.getMessage(), resetLink);
		}
	}

	private void sendViaApi(String toEmail, String subject, String textBody) throws Exception {
		Map<String, Object> payload = Map.of(
				"from", fromAddress,
				"to", new String[] { toEmail },
				"subject", subject,
				"text", textBody);

		HttpRequest request = HttpRequest.newBuilder()
				.uri(RESEND_ENDPOINT)
				.timeout(Duration.ofSeconds(10))
				.header("Authorization", "Bearer " + apiKey)
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
				.build();

		HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

		if (response.statusCode() >= 300) {
			throw new IllegalStateException(
					"Email API returned HTTP " + response.statusCode() + ": " + response.body());
		}
	}
}
