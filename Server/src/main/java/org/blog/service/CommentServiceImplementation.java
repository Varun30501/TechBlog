package org.blog.service;

import java.util.List;
import java.util.Objects;

import org.blog.model.Comment;
import org.blog.repository.CommentRepository;
import org.springframework.stereotype.Service;

@Service
public class CommentServiceImplementation implements CommentService {

	private final CommentRepository repository;

	public CommentServiceImplementation(CommentRepository repository) {
		this.repository = repository;
	}

	@Override
	public Comment addComment(Comment comment) {
		// FIX: repository.save() is declared save(@NonNull S entity) in Spring Data 3.
		// The null-safety analyser warns "Comment needs unchecked conversion to @NonNull Comment"
		// because it can't prove the parameter won't be null without an explicit assertion.
		// Objects.requireNonNull() provides that assertion at the call site.
		return this.repository.save(Objects.requireNonNull(comment));
	}

	@Override
	public Comment updateComment(Comment comment) {
		return this.repository.save(Objects.requireNonNull(comment));
	}

	@Override
	public List<Comment> findCommentsByPostId(Long postId) {
		return this.repository.findByPostPostIdOrderByCommentCreationDesc(postId);
	}

	@Override
	public void deleteComment(Long commentId) {
		// FIX: deleteById(@NonNull ID id) — same pattern as save().
		this.repository.deleteById(Objects.requireNonNull(commentId));
	}

	@Override
	public List<Comment> findCommentsByUserId(Long userId) {
		return this.repository.findByUserUserIdOrderByCommentCreationDesc(userId);
	}
}