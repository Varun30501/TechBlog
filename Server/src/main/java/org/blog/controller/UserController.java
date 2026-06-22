package org.blog.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.blog.model.User;
import org.blog.repository.UserRepository;
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

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/blog")
public class UserController {

	private final UserService userService;
	private final UserRepository repository;
	private final PasswordEncoder passwordEncoder;

	public UserController(UserService userService, UserRepository repository, PasswordEncoder passwordEncoder) {
		this.userService = userService;
		this.repository = repository;
		this.passwordEncoder = passwordEncoder;
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
		return this.repository.findById(java.util.Objects.requireNonNull(userId))
				.<ResponseEntity<?>>map(user -> {
					user.setRole(normalised);
					return ResponseEntity.ok(this.userService.updateUser(user));
				})
				.orElseGet(() -> ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(failed("User does not exist.")));
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