package org.blog.service;

import java.util.Objects;
import java.util.Optional;

import org.blog.model.User;
import org.blog.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

	private final UserRepository userRepo;

	public UserServiceImpl(UserRepository userRepo) {
		this.userRepo = userRepo;
	}

	@Override
	public User addUser(User user) {
		// FIX: save(@NonNull S entity) in Spring Data 3 — Objects.requireNonNull
		// asserts non-null at the call site, clearing "needs unchecked conversion
		// to @NonNull User" without using @NonNull on a local variable (illegal in Java).
		return this.userRepo.save(Objects.requireNonNull(user));
	}

	@Override
	public Optional<User> getUserByEmail(String email) {
		return this.userRepo.findByUserEmailIgnoreCase(email);
	}

	@Override
	public User updateUser(User user) {
		return this.userRepo.save(Objects.requireNonNull(user));
	}
}