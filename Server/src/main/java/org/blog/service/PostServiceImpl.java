package org.blog.service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.blog.model.Post;
import org.blog.repository.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;

    public PostServiceImpl(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Override
    public Post addPost(Post post) {
        return this.postRepository.save(Objects.requireNonNull(post));
    }

    @Override
    public List<Post> getAllPosts() {
        return this.postRepository.findAllByOrderByPostCreationDesc();
    }

    @Override
    public Page<Post> getFeed(String query, Long categoryId, Long tagId, Pageable pageable) {
        return this.postRepository.findFeed(query, categoryId, tagId, pageable);
    }

    @Override
    public List<Post> getPostsByCategory(Long categoryId) {
        return this.postRepository.findByCategoryCategoryIdOrderByPostCreationDesc(categoryId);
    }

    @Override
    public Optional<Post> getPostByPostId(Long postId) {
        return this.postRepository.findById(Objects.requireNonNull(postId));
    }

    @Override
    public Optional<Post> getPostBySlug(String slug) {
        return this.postRepository.findFirstByPostSlugIgnoreCase(slug);
    }

    @Override
    public Optional<Post> getPostByPostTitle(String title) {
        return this.postRepository.findFirstByPostTitleIgnoreCase(title);
    }

    @Override
    public List<Post> getPostsByUserId(Long userId) {
        return this.postRepository.findByUserUserIdOrderByPostCreationDesc(userId);
    }

    @Override
    public List<Post> searchPosts(String query) {
        String term = query == null ? "" : query.trim();
        return this.postRepository
                .findByPostTitleContainingIgnoreCaseOrPostContentContainingIgnoreCaseOrderByPostCreationDesc(term, term);
    }

    @Override
    public List<Post> getFeaturedPosts() {
        return this.postRepository.findTop3ByFeaturedTrueOrderByPostCreationDesc();
    }

    @Override
    public List<Post> getPopularPosts() {
        return this.postRepository.findTop5ByOrderByViewCountDesc();
    }

    @Override
    @Transactional
    public Post incrementViews(Long postId) {
        Post post = this.postRepository.findById(Objects.requireNonNull(postId)).orElseThrow();
        post.setViewCount(post.getViewCount() + 1);
        return post;
    }

    // ── NEW ──

    @Override
    public List<Post> getDraftsByUserId(Long userId) {
        return this.postRepository.findByUserUserIdAndStatusOrderByPostCreationDesc(userId, "DRAFT");
    }

    @Override
    public List<Post> getRelatedPosts(Long categoryId, Long excludePostId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return this.postRepository.findRelated(categoryId, excludePostId, pageable);
    }

    @Override
    public List<Post> getTopPostsByViews(int limit) {
        return this.postRepository.findTopByViews(PageRequest.of(0, limit));
    }

    @Override
    @Transactional
    @Scheduled(fixedDelay = 60_000) // run every 60 seconds
    public void publishScheduledPosts() {
        List<Post> due = this.postRepository
                .findByStatusAndScheduledAtBeforeOrderByScheduledAtAsc("SCHEDULED", Instant.now());
        for (Post p : due) {
            p.setStatus("PUBLISHED");
            p.setScheduledAt(null);
        }
        if (!due.isEmpty()) {
            this.postRepository.saveAll(due);
        }
    }
}