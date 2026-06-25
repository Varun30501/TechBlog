package org.blog.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.blog.model.Comment;
import org.blog.repository.CommentLikeRepository;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/blog")
public class CommentController {

	private final CommentService service;
	private final PostService postService;
	private final UserRepository userRepository;
	private final CommentRepository commentRepository;
	private final CommentLikeRepository commentLikeRepository;

	public CommentController(
			CommentService service,
			PostService postService,
			UserRepository userRepository,
			CommentRepository commentRepository,
			CommentLikeRepository commentLikeRepository) {
		this.service = service;
		this.postService = postService;
		this.userRepository = userRepository;
		this.commentRepository = commentRepository;
		this.commentLikeRepository = commentLikeRepository;
	}

	@PostMapping("/comment/{postId}/{userId}")
	public ResponseEntity<Map<String, String>> addComment(
			@PathVariable("userId") Long userId,
			@PathVariable("postId") Long postId,
			@Valid @RequestBody Comment comment) {

		var post = this.postService.getPostByPostId(Objects.requireNonNull(postId));
		var user = this.userRepository.findById(Objects.requireNonNull(userId));

		if (post.isEmpty() || user.isEmpty()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Post or user not found."));
		}

		if (comment.getParentCommentId() != null) {
			var parent = this.commentRepository.findById(comment.getParentCommentId());
			if (parent.isEmpty() || !Objects.equals(parent.get().getPost().getPostId(), postId)) {
				return ResponseEntity.badRequest().body(failed("Parent comment not found on this post."));
			}
		}

		Comment obj = new Comment();
		obj.setContent(comment.getContent());
		obj.setPost(post.get());
		obj.setUser(user.get());
		obj.setParentCommentId(comment.getParentCommentId());
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
	public ResponseEntity<List<Comment>> getCommentsByPostId(
			@PathVariable("postId") Long postId,
			@RequestParam(value = "userId", required = false) Long userId) {
		List<Comment> comments = this.service.findCommentsByPostId(postId);
		enrichWithLikes(comments, userId);
		return ResponseEntity.ok(comments);
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

	// ─────────────────────────────────────────────────────────
	//  LIKES (toggle)
	// ─────────────────────────────────────────────────────────
	@PostMapping("/comment/{commentId}/like/{userId}")
	public ResponseEntity<Map<String, Object>> toggleLike(
			@PathVariable("commentId") Long commentId,
			@PathVariable("userId") Long userId) {

		var commentOpt = this.commentRepository.findById(Objects.requireNonNull(commentId));
		var userOpt = this.userRepository.findById(Objects.requireNonNull(userId));
		if (commentOpt.isEmpty() || userOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "failed", "message", "Comment or user not found."));
		}

		var existing = this.commentLikeRepository.findByCommentCommentIdAndUserUserId(commentId, userId);
		boolean liked;
		if (existing.isPresent()) {
			this.commentLikeRepository.delete(existing.get());
			liked = false;
		} else {
			var like = new org.blog.model.CommentLike();
			like.setComment(commentOpt.get());
			like.setUser(userOpt.get());
			this.commentLikeRepository.save(like);
			liked = true;
		}

		long count = this.commentLikeRepository.countByCommentCommentId(commentId);
		return ResponseEntity.ok(Map.of("liked", liked, "likeCount", count));
	}

	private void enrichWithLikes(List<Comment> comments, Long userId) {
		if (comments.isEmpty()) {
			return;
		}
		List<Long> ids = comments.stream().map(Comment::getCommentId).collect(Collectors.toList());

		Map<Long, Long> countsByCommentId = this.commentLikeRepository.countByCommentIds(ids).stream()
				.collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

		Set<Long> likedIds = userId == null
				? new HashSet<>()
				: new HashSet<>(this.commentLikeRepository.findLikedCommentIds(ids, userId));

		for (Comment c : comments) {
			c.setLikeCount(countsByCommentId.getOrDefault(c.getCommentId(), 0L));
			c.setLikedByCurrentUser(likedIds.contains(c.getCommentId()));
		}
	}

	private Map<String, String> success(String message) {
		return Map.of("status", "success", "message", message);
	}

	private Map<String, String> failed(String message) {
		return Map.of("status", "failed", "message", message);
	}
}