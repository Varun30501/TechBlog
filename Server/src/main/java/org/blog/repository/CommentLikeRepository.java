package org.blog.repository;

import java.util.List;
import java.util.Optional;

import org.blog.model.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

	Optional<CommentLike> findByCommentCommentIdAndUserUserId(Long commentId, Long userId);

	long countByCommentCommentId(Long commentId);

	void deleteByCommentCommentIdAndUserUserId(Long commentId, Long userId);

	@Query("select cl.comment.commentId as commentId, count(cl) as likeCount "
			+ "from CommentLike cl where cl.comment.commentId in :commentIds group by cl.comment.commentId")
	List<Object[]> countByCommentIds(List<Long> commentIds);

	@Query("select cl.comment.commentId from CommentLike cl "
			+ "where cl.comment.commentId in :commentIds and cl.user.userId = :userId")
	List<Long> findLikedCommentIds(List<Long> commentIds, Long userId);
}