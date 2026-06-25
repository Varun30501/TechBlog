package org.blog.model;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
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

	// ── NEW: nested replies. Null means top-level comment. Stored as a plain
	// FK column (not a JPA relationship) so fetching a post's comments stays a
	// single flat query; the reply tree is assembled client-side from this id. ──
	@Column(name = "parentCommentId")
	private Long parentCommentId;

	// ── NEW: populated by the controller per-request, never persisted ──
	@Transient
	private long likeCount;

	@Transient
	private boolean likedByCurrentUser;
}