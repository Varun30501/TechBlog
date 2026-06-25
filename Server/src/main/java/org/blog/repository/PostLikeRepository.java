package org.blog.repository;

import java.util.List;
import java.util.Optional;

import org.blog.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

	Optional<PostLike> findByPostPostIdAndUserUserId(Long postId, Long userId);

	long countByPostPostId(Long postId);

	void deleteByPostPostIdAndUserUserId(Long postId, Long userId);

	@Query("select pl.post.postId as postId, count(pl) as likeCount "
			+ "from PostLike pl where pl.post.postId in :postIds group by pl.post.postId")
	List<Object[]> countByPostIds(List<Long> postIds);
}