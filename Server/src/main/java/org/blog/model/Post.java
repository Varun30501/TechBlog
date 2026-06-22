package org.blog.model;

import java.time.Instant;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity
@Data
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long postId;

    @Column(length = 120, nullable = false)
    @NotBlank(message = "Post title is required.")
    @Size(max = 120, message = "Post title must be 120 characters or fewer.")
    private String postTitle;

    @Column(length = 180)
    private String postSlug;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant postCreation;

    @UpdateTimestamp
    private Instant postUpdation;

    @Column(columnDefinition = "TEXT", nullable = false)
    @NotBlank(message = "Post content is required.")
    private String postContent;

    @Column(length = 260)
    private String postExcerpt;

    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(columnDefinition = "LONGBLOB")
    private byte[] postImage;

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    private long viewCount;

    @Column(nullable = false)
    private int readingMinutes;

    // ── NEW: publication status (DRAFT | PUBLISHED | SCHEDULED) ──
    @Column(length = 20, nullable = false)
    private String status = "PUBLISHED";

    // ── NEW: schedule timestamp (used when status = SCHEDULED) ──
    private Instant scheduledAt;

    // ── NEW: SEO fields ──
    @Column(length = 160)
    private String metaTitle;

    @Column(length = 320)
    private String metaDescription;

    @Column(length = 200)
    private String metaKeywords;

    // ── NEW: tags (many-to-many) ──
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "post_tag",
        joinColumns = @JoinColumn(name = "postId"),
        inverseJoinColumns = @JoinColumn(name = "tagId")
    )
    private Set<Tag> tags = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "categoryId")
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "userId")
    private User user;

    @PrePersist
    @PreUpdate
    private void syncBlogMetadata() {
        String content = postContent == null ? "" : postContent.trim();
        String title   = postTitle   == null ? "post" : postTitle.trim();

        if (postExcerpt == null || postExcerpt.isBlank()) {
            postExcerpt = content.length() > 240
                    ? content.substring(0, 240).trim() + "..."
                    : content;
        }

        String slugBase = title.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        postSlug = (slugBase.isBlank() ? "post" : slugBase) + "-" + System.currentTimeMillis();

        int words = content.isBlank() ? 0 : content.split("\\s+").length;
        readingMinutes = Math.max(1, (int) Math.ceil(words / 200.0));

        if (status == null || status.isBlank()) {
            status = "PUBLISHED";
        }
    }
}
