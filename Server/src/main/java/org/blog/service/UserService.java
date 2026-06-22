package org.blog.service;

import java.util.Optional;

import org.blog.model.User;

public interface UserService {
	
	User addUser(User user);
	User updateUser(User user);
	Optional<User> getUserByEmail(String email);

}
