package org.blog.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import lombok.Data;

@Entity
@Data
public class PasswordResetToken {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long tokenId;

	@Column(length = 64, nullable = false, unique = true)
	private String token;

	@ManyToOne(optional = false)
	@JoinColumn(name = "userId")
	private User user;

	@Column(nullable = false)
	private Instant expiresAt;

	@Column(nullable = false)
	private boolean used;
}
