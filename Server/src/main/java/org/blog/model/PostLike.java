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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Entity
@Data
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"postId", "userId"}))
public class PostLike {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long postLikeId;

	@ManyToOne(optional = false)
	@JoinColumn(name = "postId")
	private Post post;

	@ManyToOne(optional = false)
	@JoinColumn(name = "userId")
	private User user;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant likedAt;
}