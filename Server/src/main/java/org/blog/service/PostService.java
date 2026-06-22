package org.blog.service;

import java.util.List;
import java.util.Optional;

import org.blog.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostService {
    Post addPost(Post post);
    List<Post> getAllPosts();
    Page<Post> getFeed(String query, Long categoryId, Pageable pageable);
    List<Post> getPostsByCategory(Long categoryId);
    Optional<Post> getPostByPostId(Long postId);
    Optional<Post> getPostBySlug(String slug);
    List<Post> getPostsByUserId(Long userId);
    Optional<Post> getPostByPostTitle(String title);
    List<Post> searchPosts(String query);
    List<Post> getFeaturedPosts();
    List<Post> getPopularPosts();
    Post incrementViews(Long postId);

    // NEW
    List<Post> getDraftsByUserId(Long userId);
    List<Post> getRelatedPosts(Long categoryId, Long excludePostId, int limit);
    List<Post> getTopPostsByViews(int limit);
    void publishScheduledPosts();
}