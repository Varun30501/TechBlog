package org.blog.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.blog.model.Comment;
import org.blog.repository.CommentRepository;
import org.blog.repository.UserRepository;
import org.blog.service.CommentService;
import org.blog.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/blog")
public class CommentController {

	private final CommentService service;
	private final PostService postService;
	private final UserRepository userRepository;
	private final CommentRepository commentRepository;

	public CommentController(
			CommentService service,
			PostService postService,
			UserRepository userRepository,
			CommentRepository commentRepository) {
		this.service = service;
		this.postService = postService;
		this.userRepository = userRepository;
		this.commentRepository = commentRepository;
	}

	@PostMapping("/comment/{postId}/{userId}")
	public ResponseEntity<Map<String, String>> addComment(
			@PathVariable("userId") Long userId,
			@PathVariable("postId") Long postId,
			@Valid @RequestBody Comment comment) {

		// Objects.requireNonNull satisfies the @NonNull constraint on repository
		// findById() without placing @NonNull on a local variable (illegal in Java).
		var post = this.postService.getPostByPostId(Objects.requireNonNull(postId));
		var user = this.userRepository.findById(Objects.requireNonNull(userId));

		if (post.isEmpty() || user.isEmpty()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Post or user not found."));
		}

		Comment obj = new Comment();
		obj.setContent(comment.getContent());
		obj.setPost(post.get());
		obj.setUser(user.get());
		this.service.addComment(obj);

		return ResponseEntity.status(HttpStatus.CREATED).body(success("Comment added."));
	}

	@PutMapping("/comment")
	public ResponseEntity<Map<String, String>> updateComment(@Valid @RequestBody Comment comment) {
		try {
			return this.commentRepository.findById(Objects.requireNonNull(comment.getCommentId()))
					.map(existingComment -> {
						existingComment.setContent(comment.getContent());
						this.service.addComment(existingComment);
						return ResponseEntity.ok(success("Comment updated."));
					})
					.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Comment not found.")));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(failed("Comment not updated."));
		}
	}

	@DeleteMapping("/comment/{commentId}")
	public ResponseEntity<Map<String, String>> deleteComment(@PathVariable("commentId") Long commentId) {
		try {
			this.service.deleteComment(commentId);
			return ResponseEntity.ok(success("Comment deleted."));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Comment not deleted."));
		}
	}

	@GetMapping("/comment/{postId}")
	public ResponseEntity<List<Comment>> getCommentsByPostId(@PathVariable("postId") Long postId) {
		return ResponseEntity.ok(this.service.findCommentsByPostId(postId));
	}

	@GetMapping("/comment/user/{userId}")
	public ResponseEntity<List<Comment>> getCommentsByUserId(@PathVariable("userId") Long userId) {
		return ResponseEntity.ok(this.service.findCommentsByUserId(userId));
	}

	@GetMapping("/comments")
	public ResponseEntity<List<Comment>> getAllComments() {
		return ResponseEntity.ok(this.commentRepository.findAll());
	}

	@GetMapping("/getcomment/{commentId}")
	public ResponseEntity<?> getCommentByCommentId(@PathVariable("commentId") Long commentId) {
		return this.commentRepository.findById(Objects.requireNonNull(commentId))
				.<ResponseEntity<?>>map(comment -> ResponseEntity.ok(comment))
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Comment not found.")));
	}

	private Map<String, String> success(String message) {
		return Map.of("status", "success", "message", message);
	}

	private Map<String, String> failed(String message) {
		return Map.of("status", "failed", "message", message);
	}
}