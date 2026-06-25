package org.blog.controller;

import java.io.IOException;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;

import org.blog.model.Post;
import org.blog.model.PostLike;
import org.blog.model.Tag;
import org.blog.repository.CategoryRepository;
import org.blog.repository.PostLikeRepository;
import org.blog.repository.PostRepository;
import org.blog.repository.TagRepository;
import org.blog.repository.UserRepository;
import org.blog.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/blog")
public class PostController {

    private final PostService service;
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepo;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final PostLikeRepository postLikeRepository;

    public PostController(
            PostService service,
            PostRepository postRepository,
            CategoryRepository categoryRepo,
            UserRepository userRepository,
            TagRepository tagRepository,
            PostLikeRepository postLikeRepository) {
        this.service = service;
        this.postRepository = postRepository;
        this.categoryRepo = categoryRepo;
        this.userRepository = userRepository;
        this.tagRepository = tagRepository;
        this.postLikeRepository = postLikeRepository;
    }

    // ─────────────────────────────────────────────────────────
    //  CREATE
    // ─────────────────────────────────────────────────────────
    @PostMapping("/post")
    public ResponseEntity<Map<String, String>> addPost(
            @RequestParam("postTitle") String postTitle,
            @RequestParam("postContent") String postContent,
            @RequestParam(value = "postImage", required = false) MultipartFile postImage,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "postExcerpt", required = false) String postExcerpt,
            @RequestParam(value = "featured", defaultValue = "false") boolean featured,
            @RequestParam(value = "status", defaultValue = "PUBLISHED") String status,
            @RequestParam(value = "scheduledAt", required = false) String scheduledAt,
            @RequestParam(value = "metaTitle", required = false) String metaTitle,
            @RequestParam(value = "metaDescription", required = false) String metaDescription,
            @RequestParam(value = "metaKeywords", required = false) String metaKeywords,
            @RequestParam(value = "tags", required = false) String tags) throws IOException {

        Post post = new Post();
        post.setPostTitle(postTitle);
        post.setPostContent(postContent);
        post.setPostExcerpt(postExcerpt);
        post.setFeatured(featured);
        post.setStatus(status);
        post.setMetaTitle(metaTitle);
        post.setMetaDescription(metaDescription);
        post.setMetaKeywords(metaKeywords);

        if (scheduledAt != null && !scheduledAt.isBlank()) {
            post.setScheduledAt(Instant.parse(scheduledAt));
        }
        if (postImage != null && !postImage.isEmpty()) {
            post.setPostImage(postImage.getBytes());
        }

        var category = categoryRepo.findById(Objects.requireNonNull(categoryId))
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        var user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        post.setCategory(category);
        post.setUser(user);
        post.setTags(resolveTags(tags));

        Post saved = this.service.addPost(post);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("status", "success", "message", "Post saved.", "postId", String.valueOf(saved.getPostId())));
    }

    // ─────────────────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────────────────
    @PutMapping("/post")
    public ResponseEntity<Map<String, String>> updatePost(
            @RequestParam("postId") Long postId,
            @RequestParam("postTitle") String postTitle,
            @RequestParam("postContent") String postContent,
            @RequestParam(value = "postImage", required = false) MultipartFile postImage,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "postExcerpt", required = false) String postExcerpt,
            @RequestParam(value = "featured", defaultValue = "false") boolean featured,
            @RequestParam(value = "status", defaultValue = "PUBLISHED") String status,
            @RequestParam(value = "scheduledAt", required = false) String scheduledAt,
            @RequestParam(value = "metaTitle", required = false) String metaTitle,
            @RequestParam(value = "metaDescription", required = false) String metaDescription,
            @RequestParam(value = "metaKeywords", required = false) String metaKeywords,
            @RequestParam(value = "tags", required = false) String tags) throws IOException {

        var existing = this.service.getPostByPostId(Objects.requireNonNull(postId));
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Post not found."));
        }
        Post post = existing.get();
        post.setPostTitle(postTitle);
        post.setPostContent(postContent);
        post.setPostExcerpt(postExcerpt);
        post.setFeatured(featured);
        post.setStatus(status);
        post.setMetaTitle(metaTitle);
        post.setMetaDescription(metaDescription);
        post.setMetaKeywords(metaKeywords);
        post.setTags(resolveTags(tags));

        if (scheduledAt != null && !scheduledAt.isBlank()) {
            post.setScheduledAt(Instant.parse(scheduledAt));
        } else if ("PUBLISHED".equals(status)) {
            post.setScheduledAt(null);
        }
        if (postImage != null && !postImage.isEmpty()) {
            post.setPostImage(postImage.getBytes());
        }

        var category = categoryRepo.findById(Objects.requireNonNull(categoryId)).orElseThrow();
        post.setCategory(category);
        this.service.addPost(post);
        return ResponseEntity.ok(success("Post updated."));
    }

    // ─────────────────────────────────────────────────────────
    //  READ – existing endpoints
    // ─────────────────────────────────────────────────────────
    @GetMapping("/posts")
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(this.service.getAllPosts());
    }

    @GetMapping("/posts/feed")
    public ResponseEntity<Page<Post>> getFeed(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "tagId", required = false) Long tagId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "9") int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, 30)),
                Sort.by(Sort.Direction.DESC, "postCreation"));
        return ResponseEntity.ok(this.service.getFeed(query, categoryId, tagId, pageable));
    }

    @GetMapping("/posts/featured")
    public ResponseEntity<List<Post>> getFeaturedPosts() {
        return ResponseEntity.ok(this.service.getFeaturedPosts());
    }

    @GetMapping("/posts/popular")
    public ResponseEntity<List<Post>> getPopularPosts() {
        return ResponseEntity.ok(this.service.getPopularPosts());
    }

    @GetMapping("/posts/{categoryId}")
    public ResponseEntity<List<Post>> getPostsByCategory(@PathVariable("categoryId") Long categoryId) {
        return ResponseEntity.ok(this.service.getPostsByCategory(categoryId));
    }

    @GetMapping("/post/slug/{slug}")
    public ResponseEntity<?> getPostBySlug(@PathVariable String slug) {
        return this.service.getPostBySlug(slug)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Post not found.")));
    }

    @GetMapping("/post/user/{userId}")
    public ResponseEntity<List<Post>> getPostsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(this.service.getPostsByUserId(userId));
    }

    @GetMapping("/post/search")
    public ResponseEntity<?> getPostsByTitle(@RequestParam("postTitle") String postTitle) {
        return ResponseEntity.ok(this.service.searchPosts(postTitle));
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<?> getPostsById(@PathVariable Long postId) {
        try {
            return ResponseEntity.ok(this.service.incrementViews(postId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Post not found."));
        }
    }

    @DeleteMapping("/post/{postId}")
    public ResponseEntity<Map<String, String>> deleteByPostId(@PathVariable Long postId) {
        try {
            this.postRepository.deleteById(Objects.requireNonNull(postId));
            return ResponseEntity.ok(success("Post deleted."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Post id not found."));
        }
    }

    // ─────────────────────────────────────────────────────────
    //  NEW endpoints
    // ─────────────────────────────────────────────────────────

    /** My drafts */
    @GetMapping("/post/drafts/{userId}")
    public ResponseEntity<List<Post>> getDrafts(@PathVariable Long userId) {
        return ResponseEntity.ok(this.service.getDraftsByUserId(userId));
    }

    /** Related posts (same category, top 3 by views) */
    @GetMapping("/post/{postId}/related")
    public ResponseEntity<List<Post>> getRelated(@PathVariable Long postId) {
        return this.service.getPostByPostId(postId)
                .<ResponseEntity<List<Post>>>map(post -> {
                    Long catId;
                    if (post.getCategory() != null) {
                        catId = post.getCategory().getCategoryId();
                    } else {
                        catId = -1L;
                    }
                    return ResponseEntity.ok(this.service.getRelatedPosts(catId, postId, 3));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /** Analytics: top N posts by views */
    @GetMapping("/analytics/top-posts")
    public ResponseEntity<List<Post>> topPosts(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(this.service.getTopPostsByViews(Math.min(limit, 50)));
    }

    // ─────────────────────────────────────────────────────────
    //  LIKES (toggle)
    // ─────────────────────────────────────────────────────────
    @PostMapping("/post/{postId}/like/{userId}")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable("postId") Long postId,
            @PathVariable("userId") Long userId) {

        var postOpt = this.postRepository.findById(Objects.requireNonNull(postId));
        var userOpt = this.userRepository.findById(Objects.requireNonNull(userId));
        if (postOpt.isEmpty() || userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "failed", "message", "Post or user not found."));
        }

        var existing = this.postLikeRepository.findByPostPostIdAndUserUserId(postId, userId);
        boolean liked;
        if (existing.isPresent()) {
            this.postLikeRepository.delete(existing.get());
            liked = false;
        } else {
            PostLike like = new PostLike();
            like.setPost(postOpt.get());
            like.setUser(userOpt.get());
            this.postLikeRepository.save(like);
            liked = true;
        }

        long count = this.postLikeRepository.countByPostPostId(postId);
        return ResponseEntity.ok(Map.of("liked", liked, "likeCount", count));
    }

    @GetMapping("/post/{postId}/like-status")
    public ResponseEntity<Map<String, Object>> likeStatus(
            @PathVariable("postId") Long postId,
            @RequestParam(value = "userId", required = false) Long userId) {

        long count = this.postLikeRepository.countByPostPostId(postId);
        boolean liked = userId != null
                && this.postLikeRepository.findByPostPostIdAndUserUserId(postId, userId).isPresent();
        return ResponseEntity.ok(Map.of("liked", liked, "likeCount", count));
    }

    // ─────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────
    private Set<Tag> resolveTags(String commaSeparated) {
        Set<Tag> result = new HashSet<>();
        if (commaSeparated == null || commaSeparated.isBlank()) return result;
        for (String name : commaSeparated.split(",")) {
            String clean = name.trim();
            if (clean.isEmpty()) continue;
            Tag tag = tagRepository.findByTagNameIgnoreCase(clean).orElseGet(() -> {
                Tag t = new Tag();
                t.setTagName(clean);
                t.setTagSlug(clean.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"));
                return tagRepository.save(t);
            });
            result.add(tag);
        }
        return result;
    }

    private Map<String, String> success(String msg) { return Map.of("status", "success", "message", msg); }
    private Map<String, String> failed(String msg)  { return Map.of("status", "failed",  "message", msg); }
}