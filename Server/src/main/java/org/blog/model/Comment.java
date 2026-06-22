package org.blog.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotBlank;

import org.hibernate.annotations.CreationTimestamp;

import lombok.Data;

@Entity
@Data
public class Comment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long commentId;
	
	@Column(length = 1000, nullable = false)
	@NotBlank(message = "Comment content is required.")
	private String content;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant commentCreation;
	
	@ManyToOne(optional = false)
	@JoinColumn(name = "postId")
	private Post post;
	
	
	@ManyToOne(optional = false)
	@JoinColumn(name = "userId")
	private User user;
}
