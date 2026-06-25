import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Comment } from 'src/app/model/Comment';
import { Category, Post } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';
import { avatarImageSrc } from 'src/app/util/avatar-image';

export interface CommentNode extends Comment {
  replies: CommentNode[];
}

@Component({
  selector: 'app-single-post',
  standalone: false,
  templateUrl: './single-post.component.html',
  styleUrls: ['./single-post.component.css']
})
export class SinglePostComponent implements OnInit {

  postId = 0;
  post: Post | null = null;
  comments: Comment[] = [];
  commentTree: CommentNode[] = [];
  categories: Category[] = [];
  popularPosts: Post[] = [];
  relatedPosts: Post[] = [];
  loginStatus = localStorage.getItem('loginStatus');
  loading = true;
  commentSaving = false;
  errorMessage = '';
  commentMessage = '';

  postLiked = false;
  postLikeCount = 0;
  likingPost = false;

  replyingToId: number | null = null;
  replyText = '';
  replySaving = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private service: PostapiService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.postId = Number(params.get('postId'));
      this.post = null;
      this.loading = true;
      this.errorMessage = '';
      this.comments = [];
      this.cdr.markForCheck();
      this.loadPost();
    });
  }

  get isSignedIn(): boolean {
    return this.loginStatus === 'active';
  }

  /** True if current viewer is the author of the given post */
  private isAuthor(post: Post): boolean {
    const userId = Number(localStorage.getItem('userId'));
    return !!userId && post.user?.userId === userId;
  }

  loadPost(): void {
    this.service.getSinglePost(this.postId).subscribe({
      next: (response) => {
        // Draft and scheduled posts are only visible to their author
        const isNonPublished = response.status === 'DRAFT' || response.status === 'SCHEDULED';
        if (isNonPublished && !this.isAuthor(response)) {
          this.errorMessage = 'This post is not available.';
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.post = response;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.errorMessage = 'Post could not be loaded.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.service.getCommentsForPost(this.postId, Number(localStorage.getItem('userId')) || null).subscribe({
      next: (response) => {
        this.comments = response;
        this.commentTree = this.buildCommentTree(response);
        this.cdr.markForCheck();
      },
      error: () => {
        this.comments = [];
        this.commentTree = [];
        this.cdr.markForCheck();
      }
    });

    this.service.getPostLikeStatus(this.postId, Number(localStorage.getItem('userId')) || null).subscribe({
      next: (res) => {
        this.postLiked = !!res.liked;
        this.postLikeCount = res.likeCount || 0;
        this.cdr.markForCheck();
      },
      error: () => { /* leave defaults */ }
    });

    this.service.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.markForCheck();
      },
      error: () => {
        this.categories = [];
      }
    });

    this.service.getRelatedPosts(this.postId).subscribe({
      next: (posts: import('src/app/model/Post').Post[]) => { this.relatedPosts = posts; this.cdr.markForCheck(); },
      error: () => { this.relatedPosts = []; }
    });

    this.service.getPopularPosts().subscribe({
      next: (posts) => {
        this.popularPosts = posts.filter((p) => p.postId !== this.postId).slice(0, 4);
        this.cdr.markForCheck();
      },
      error: () => {
        this.popularPosts = [];
      }
    });
  }

  buildCommentTree(flat: Comment[]): CommentNode[] {
    const byId = new Map<number, CommentNode>();
    flat.forEach((c) => byId.set(c.commentId as number, { ...c, replies: [] }));

    const roots: CommentNode[] = [];
    byId.forEach((node) => {
      if (node.parentCommentId && byId.has(node.parentCommentId)) {
        byId.get(node.parentCommentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    // Replies read best oldest-first within a thread; top-level stays newest-first (API order).
    const sortRepliesAsc = (nodes: CommentNode[]) => {
      nodes.sort((a, b) => new Date(a.commentCreation || 0).getTime() - new Date(b.commentCreation || 0).getTime());
      nodes.forEach((n) => sortRepliesAsc(n.replies));
    };
    roots.forEach((r) => sortRepliesAsc(r.replies));

    return roots;
  }

  refreshComments(): void {
    this.service.getCommentsForPost(this.postId, Number(localStorage.getItem('userId')) || null).subscribe((comments) => {
      this.comments = comments;
      this.commentTree = this.buildCommentTree(comments);
      this.cdr.markForCheck();
    });
  }

  addComment(content: string): void {
    const text = content.trim();
    const userId = Number(localStorage.getItem('userId'));
    if (!text || !userId || !this.post) {
      this.commentMessage = 'Sign in and write a comment before posting.';
      return;
    }

    this.commentSaving = true;
    this.service.addComment(this.post.postId, userId, { content: text }).subscribe({
      next: () => {
        this.commentSaving = false;
        this.commentMessage = 'Comment added.';
        this.refreshComments();
      },
      error: (error) => {
        this.commentSaving = false;
        this.commentMessage = error.error?.message || 'Comment could not be added.';
        this.cdr.markForCheck();
      }
    });
  }

  togglePostLike(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !this.post || this.likingPost) { return; }
    this.likingPost = true;
    // Optimistic UI update
    const prevLiked = this.postLiked;
    const prevCount = this.postLikeCount;
    this.postLiked = !prevLiked;
    this.postLikeCount = prevCount + (this.postLiked ? 1 : -1);

    this.service.togglePostLike(this.post.postId, userId).subscribe({
      next: (res) => {
        this.postLiked = !!res.liked;
        this.postLikeCount = res.likeCount || 0;
        this.likingPost = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // Roll back on failure
        this.postLiked = prevLiked;
        this.postLikeCount = prevCount;
        this.likingPost = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleCommentLike(comment: CommentNode): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) { return; }
    const prevLiked = comment.likedByCurrentUser;
    const prevCount = comment.likeCount || 0;
    comment.likedByCurrentUser = !prevLiked;
    comment.likeCount = prevCount + (comment.likedByCurrentUser ? 1 : -1);

    this.service.toggleCommentLike(comment.commentId as number, userId).subscribe({
      next: (res) => {
        comment.likedByCurrentUser = !!res.liked;
        comment.likeCount = res.likeCount || 0;
        this.cdr.markForCheck();
      },
      error: () => {
        comment.likedByCurrentUser = prevLiked;
        comment.likeCount = prevCount;
        this.cdr.markForCheck();
      }
    });
  }

  startReply(commentId: number): void {
    this.replyingToId = commentId;
    this.replyText = '';
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyText = '';
  }

  submitReply(parentCommentId: number): void {
    const text = this.replyText.trim();
    const userId = Number(localStorage.getItem('userId'));
    if (!text || !userId || !this.post) { return; }

    this.replySaving = true;
    this.service.addComment(this.post.postId, userId, { content: text, parentCommentId }).subscribe({
      next: () => {
        this.replySaving = false;
        this.replyingToId = null;
        this.replyText = '';
        this.refreshComments();
      },
      error: (error) => {
        this.replySaving = false;
        this.commentMessage = error.error?.message || 'Reply could not be added.';
        this.cdr.markForCheck();
      }
    });
  }

  imageSrc = postImageSrc;
  avatarSrc = avatarImageSrc;

  /* ── Author avatar: the real, backend-stored photo of whoever WROTE this
     post (post.user), not the current viewer. The previous version read
     localStorage keyed by the logged-in viewer's own userId, which meant
     every post showed the *reader's* avatar instead of the author's — this
     fixes that by using the avatar that comes back on post.user directly. ── */
  get authorAvatar(): string | null {
    return avatarImageSrc(this.post?.user);
  }

  /* The fields below (title/org/qualification/bio/expertise/links) are still
     sourced from localStorage rather than the database, because the User
     entity doesn't have columns for them yet. That means — same as before —
     they reflect whoever is currently signed in on THIS browser, not
     necessarily the actual post author. Worth a follow-up if author bio
     cards need to be accurate for every reader, not just the author viewing
     their own post. */
  get authorTitle():         string { return localStorage.getItem('userTitle')         || ''; }
  get authorOrg():           string { return localStorage.getItem('userOrg')           || ''; }
  get authorQualification(): string { return localStorage.getItem('userQualification') || ''; }
  get authorBio():           string { return localStorage.getItem('userBio')           || ''; }
  get authorExpertise():     string { return localStorage.getItem('userExpertise')     || ''; }
  get authorLinkedIn():      string { return localStorage.getItem('userLinkedIn')      || ''; }
  get authorWebsite():       string { return localStorage.getItem('userWebsite')       || ''; }

  hasImage(post: Post): boolean {
    return !!(post.postImage && post.postImage.length > 0);
  }

  get pageUrl(): string {
    return typeof window !== 'undefined' ? window.location.href : '';
  }

  copyLink(): void {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  initials(name?: string): string {
    return (name || 'T').slice(0, 1);
  }
}