package org.blog.controller;

import java.util.List;
import java.util.Map;

import org.blog.model.Post;
import org.blog.repository.CategoryRepository;
import org.blog.repository.CommentRepository;
import org.blog.repository.PostRepository;
import org.blog.repository.UserRepository;
import org.blog.service.PostService;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blog")
public class StatsController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PostService postService;

    public StatsController(
            PostRepository postRepository,
            CommentRepository commentRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            PostService postService) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.postService = postService;
    }

    /** Basic counts for dashboard header cards */
    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return Map.of(
                "posts",      postRepository.count(),
                "comments",   commentRepository.count(),
                "users",      userRepository.count(),
                "categories", categoryRepository.count(),
                "published",  postRepository.countByStatus("PUBLISHED"),
                "drafts",     postRepository.countByStatus("DRAFT"),
                "scheduled",  postRepository.countByStatus("SCHEDULED"));
    }

    /** Full analytics payload for the analytics dashboard */
    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(
            @RequestParam(value = "topN", defaultValue = "10") int topN) {

        List<Post> topPosts = postService.getTopPostsByViews(Math.min(topN, 50));

        // views-by-category aggregation
        var categoryViews = postRepository.findAll().stream()
                .filter(p -> "PUBLISHED".equals(p.getStatus()) && p.getCategory() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        p -> p.getCategory().getCategoryName(),
                        java.util.stream.Collectors.summingLong(Post::getViewCount)));

        // total views
        long totalViews = postRepository.findAll().stream()
                .mapToLong(Post::getViewCount).sum();

        return Map.of(
                "topPosts", topPosts,
                "categoryViews", categoryViews,
                "totalViews", totalViews,
                "totalPosts", postRepository.count(),
                "totalComments", commentRepository.count(),
                "totalUsers", userRepository.count(),
                "published", postRepository.countByStatus("PUBLISHED"),
                "drafts", postRepository.countByStatus("DRAFT"),
                "scheduled", postRepository.countByStatus("SCHEDULED"));
    }
}
