package org.blog.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Entity 
@Data
public class User {   //Bean validation
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long userId;
	
	@Column(length = 100, nullable = false)
	@NotBlank(message = "Name is required.")
	private String userName;
	
	@Column(length = 80, nullable = false)
	@NotBlank(message = "Password is required.")
	@Size(min = 8, max = 80, message = "password must be at least 8 characters long.")
	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	private String userPassword;
	
	
	@Column(length = 80, updatable = false, unique = true)
	@NotBlank(message = "Email is required.")
	@Email(message = "Email id format is incorrect.")
	private String userEmail;
	
	private LocalDate dob;
	
	@Column(length = 240)
	private String about;
	
	@Column(length = 20, nullable = false)
	private String role;

	@PrePersist
	private void syncDefaults() {
		if (role == null || role.isBlank()) {
			role = "USER";
		}
	}
	

}
