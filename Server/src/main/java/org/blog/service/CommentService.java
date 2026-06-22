package org.blog.service;

import java.util.List;

import org.blog.model.Comment;

public interface CommentService {

	Comment addComment(Comment comment);
	Comment updateComment(Comment comment);
	List<Comment> findCommentsByPostId(Long postId);
	List<Comment> findCommentsByUserId(Long userId);
	void deleteComment(Long commentId);
}
