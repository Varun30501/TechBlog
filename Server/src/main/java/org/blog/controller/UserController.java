package org.blog.controller;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.blog.model.PasswordResetToken;
import org.blog.model.User;
import org.blog.repository.PasswordResetTokenRepository;
import org.blog.repository.UserRepository;
import org.blog.service.EmailService;
import org.blog.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/blog")
public class UserController {

	private static final int RESET_TOKEN_VALID_MINUTES = 30;

	private final UserService userService;
	private final UserRepository repository;
	private final PasswordEncoder passwordEncoder;
	private final PasswordResetTokenRepository resetTokenRepository;
	private final EmailService emailService;

	public UserController(
			UserService userService,
			UserRepository repository,
			PasswordEncoder passwordEncoder,
			PasswordResetTokenRepository resetTokenRepository,
			EmailService emailService) {
		this.userService = userService;
		this.repository = repository;
		this.passwordEncoder = passwordEncoder;
		this.resetTokenRepository = resetTokenRepository;
		this.emailService = emailService;
	}

	@PostMapping("/signup")
	public ResponseEntity<Map<String, String>> signup(@Valid @RequestBody User user) {
		user.setUserId(null);
		user.setUserPassword(passwordEncoder.encode(user.getUserPassword()));
		User savedUser = this.userService.addUser(user);
		return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
				"status", "success",
				"message", "User registered.",
				"userId", String.valueOf(savedUser.getUserId())));
	}

	@GetMapping("/login")
	public ResponseEntity<Map<String, String>> login(
			@RequestParam("email") String email,
			@RequestParam("password") String password) {
		Optional<User> existingUser = this.userService.getUserByEmail(email);
		if (existingUser.isPresent()) {
			User user = existingUser.get();
			if (matchesPassword(password, user.getUserPassword())) {
				if (password.equals(user.getUserPassword())) {
					user.setUserPassword(passwordEncoder.encode(password));
					userService.updateUser(user);
				}
				return ResponseEntity.ok(Map.of(
						"status", "success",
						"message", "User authenticated",
						"userId", String.valueOf(user.getUserId()),
						"userName", user.getUserName(),
						"userRole", user.getRole(),
						"email", user.getUserEmail()));
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(failed("User password incorrect."));
			}
		} else {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(failed("User email does not exist."));
		}
	}

	@GetMapping("/users")
	public ResponseEntity<List<User>> getAllUsers() {
		return ResponseEntity.ok(this.repository.findAll());
	}

	@GetMapping("/user/{userId}")
	public ResponseEntity<?> getUserById(@PathVariable Long userId) {
		return this.repository.findById(Objects.requireNonNull(userId))
				.<ResponseEntity<?>>map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("User does not exist.")));
	}

	@PutMapping("/user/{userId}")
	public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody User user) {
		return this.repository.findById(Objects.requireNonNull(userId))
				.<ResponseEntity<?>>map(existingUser -> {
					if (user.getUserName() != null && !user.getUserName().isBlank())
						existingUser.setUserName(user.getUserName());
					if (user.getAbout() != null)
						existingUser.setAbout(user.getAbout());
					if (user.getDob() != null)
						existingUser.setDob(user.getDob());
					if (user.getRole() != null && !user.getRole().isBlank())
						existingUser.setRole(user.getRole());
					if (user.getUserPassword() != null && !user.getUserPassword().isBlank())
						existingUser.setUserPassword(passwordEncoder.encode(user.getUserPassword()));
					User updated = this.userService.updateUser(existingUser);
					return ResponseEntity.ok(updated);
				})
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("User does not exist.")));
	}

	// ─────────────────────────────────────────────────────────
	//  AVATAR
	// ─────────────────────────────────────────────────────────
	@PutMapping("/user/{userId}/avatar")
	public ResponseEntity<?> updateAvatar(
			@PathVariable Long userId,
			@RequestParam("avatar") MultipartFile avatar) {

		if (avatar == null || avatar.isEmpty()) {
			return ResponseEntity.badRequest().body(failed("No image was provided."));
		}

		return this.repository.findById(Objects.requireNonNull(userId))
				.<ResponseEntity<?>>map(existingUser -> {
					try {
						existingUser.setAvatarImage(avatar.getBytes());
					} catch (IOException e) {
						return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
								.body(failed("Avatar could not be read."));
					}
					User updated = this.userService.updateUser(existingUser);
					return ResponseEntity.ok(updated);
				})
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("User does not exist.")));
	}

	@DeleteMapping("/user/{userId}/avatar")
	public ResponseEntity<?> deleteAvatar(@PathVariable Long userId) {
		return this.repository.findById(Objects.requireNonNull(userId))
				.<ResponseEntity<?>>map(existingUser -> {
					existingUser.setAvatarImage(null);
					return ResponseEntity.ok(this.userService.updateUser(existingUser));
				})
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("User does not exist.")));
	}

	@DeleteMapping("/user/{userId}")
	public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long userId) {
		return this.repository.findById(Objects.requireNonNull(userId))
				.map(user -> {
					this.repository.delete(user);
					return ResponseEntity.ok(success("User deleted."));
				})
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("User does not exist.")));
	}


	@PutMapping("/user/{userId}/role")
	public ResponseEntity<?> changeRole(@PathVariable Long userId, @RequestParam("role") String role) {
		String normalised = role.trim().toUpperCase();
		if (!normalised.equals("ADMIN") && !normalised.equals("EDITOR") && !normalised.equals("USER")) {
			return ResponseEntity.badRequest().body(failed("Invalid role. Allowed: USER, EDITOR, ADMIN."));
		}
		return this.repository.findById(Objects.requireNonNull(userId))
				.<ResponseEntity<?>>map(user -> {
					user.setRole(normalised);
					return ResponseEntity.ok(this.userService.updateUser(user));
				})
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("User does not exist.")));
	}

	// ─────────────────────────────────────────────────────────
	//  PASSWORD RESET
	// ─────────────────────────────────────────────────────────
	@PostMapping("/forgot-password")
	public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
		String email = body.get("email");
		// Always return the same generic message, whether or not the email exists,
		// so this endpoint can't be used to enumerate registered accounts.
		Map<String, String> genericResponse = success(
				"If an account exists for that email, a reset link has been sent.");

		if (email == null || email.isBlank()) {
			return ResponseEntity.ok(genericResponse);
		}

		Optional<User> userOpt = this.userService.getUserByEmail(email.trim());
		if (userOpt.isEmpty()) {
			return ResponseEntity.ok(genericResponse);
		}

		User user = userOpt.get();
		// Invalidate any earlier outstanding tokens for this user before issuing a new one.
		this.resetTokenRepository.deleteByUserUserId(user.getUserId());

		PasswordResetToken resetToken = new PasswordResetToken();
		resetToken.setToken(UUID.randomUUID().toString().replace("-", ""));
		resetToken.setUser(user);
		resetToken.setExpiresAt(Instant.now().plusSeconds(RESET_TOKEN_VALID_MINUTES * 60L));
		resetToken.setUsed(false);
		this.resetTokenRepository.save(resetToken);

		this.emailService.sendPasswordResetEmail(user.getUserEmail(), resetToken.getToken());

		return ResponseEntity.ok(genericResponse);
	}

	@PostMapping("/reset-password")
	public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
		String token = body.get("token");
		String newPassword = body.get("newPassword");

		if (token == null || token.isBlank() || newPassword == null || newPassword.length() < 8) {
			return ResponseEntity.badRequest().body(failed("Password must be at least 8 characters long."));
		}

		Optional<PasswordResetToken> tokenOpt = this.resetTokenRepository.findByToken(token);
		if (tokenOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(failed("This reset link is invalid."));
		}

		PasswordResetToken resetToken = tokenOpt.get();
		if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(Instant.now())) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(failed("This reset link has expired. Please request a new one."));
		}

		User user = resetToken.getUser();
		user.setUserPassword(passwordEncoder.encode(newPassword));
		this.userService.updateUser(user);

		resetToken.setUsed(true);
		this.resetTokenRepository.save(resetToken);

		return ResponseEntity.ok(success("Password updated. You can now sign in."));
	}

	private Map<String, String> success(String message) {
		return Map.of("status", "success", "message", message);
	}

	private Map<String, String> failed(String message) {
		return Map.of("status", "failed", "message", message);
	}

	private boolean matchesPassword(String rawPassword, String storedPassword) {
		if (storedPassword == null) return false;
		if (rawPassword.equals(storedPassword)) return true;
		try {
			return passwordEncoder.matches(rawPassword, storedPassword);
		} catch (IllegalArgumentException e) {
			return false;
		}
	}
}