package org.blog.repository;

import java.util.List;

import org.blog.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long>{

	List<Comment> findByPostPostIdOrderByCommentCreationDesc(Long postId);
	
	List<Comment> findByUserUserIdOrderByCommentCreationDesc(Long userId);
}
