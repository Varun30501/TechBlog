package org.blog.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.blog.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // ── existing ──
    List<Post> findAllByOrderByPostCreationDesc();
    List<Post> findByCategoryCategoryIdOrderByPostCreationDesc(Long categoryId);
    List<Post> findByUserUserIdOrderByPostCreationDesc(Long userId);
    Optional<Post> findFirstByPostTitleIgnoreCase(String title);
    Optional<Post> findFirstByPostSlugIgnoreCase(String slug);

    List<Post> findByPostTitleContainingIgnoreCaseOrPostContentContainingIgnoreCaseOrderByPostCreationDesc(
            String title, String content);

    List<Post> findTop3ByFeaturedTrueOrderByPostCreationDesc();
    List<Post> findTop5ByOrderByViewCountDesc();

    @Query("""
            select p from Post p
            where (:query is null or :query = ''
                or lower(p.postTitle) like lower(concat('%', :query, '%'))
                or lower(p.postContent) like lower(concat('%', :query, '%')))
            and (:categoryId is null or p.category.categoryId = :categoryId)
            and (:tagId is null or exists (select 1 from p.tags t where t.tagId = :tagId))
            and p.status = 'PUBLISHED'
            """)
    Page<Post> findFeed(
            @Param("query") String query,
            @Param("categoryId") Long categoryId,
            @Param("tagId") Long tagId,
            Pageable pageable);

    // ── NEW: drafts & scheduled ──
    List<Post> findByUserUserIdAndStatusOrderByPostCreationDesc(Long userId, String status);
    List<Post> findByStatusAndScheduledAtBeforeOrderByScheduledAtAsc(String status, Instant now);

    // ── NEW: related posts (same category, excluding current, published) ──
    @Query("""
            select p from Post p
            where p.category.categoryId = :categoryId
              and p.postId <> :excludeId
              and p.status = 'PUBLISHED'
            order by p.viewCount desc
            """)
    List<Post> findRelated(@Param("categoryId") Long categoryId, @Param("excludeId") Long excludeId, Pageable pageable);

    // ── NEW: analytics – top posts by views ──
    @Query("select p from Post p where p.status = 'PUBLISHED' order by p.viewCount desc")
    List<Post> findTopByViews(Pageable pageable);

    // ── NEW: posts by tag ──
    @Query("select p from Post p join p.tags t where t.tagId = :tagId and p.status = 'PUBLISHED' order by p.postCreation desc")
    List<Post> findByTagId(@Param("tagId") Long tagId);

    // ── NEW: count published posts ──
    long countByStatus(String status);
}