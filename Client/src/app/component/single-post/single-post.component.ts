import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Comment } from 'src/app/model/Comment';
import { Category, Post } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';

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
  categories: Category[] = [];
  popularPosts: Post[] = [];
  relatedPosts: Post[] = [];
  loginStatus = localStorage.getItem('loginStatus');
  loading = true;
  commentSaving = false;
  errorMessage = '';
  commentMessage = '';

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

    this.service.getCommentsForPost(this.postId).subscribe({
      next: (response) => {
        this.comments = response;
        this.cdr.markForCheck();
      },
      error: () => {
        this.comments = [];
        this.cdr.markForCheck();
      }
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
        this.service.getCommentsForPost(this.postId).subscribe((comments) => {
          this.comments = comments;
          this.cdr.markForCheck();
        });
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.commentSaving = false;
        this.commentMessage = error.error?.message || 'Comment could not be added.';
        this.cdr.markForCheck();
      }
    });
  }

  imageSrc = postImageSrc;

  /* ── Author profile data (read from localStorage, set by profile page) ── */
  readonly AVATAR_KEY = 'userAvatar_';

  get authorAvatar(): string | null {
    const uid = localStorage.getItem('userId');
    return uid ? localStorage.getItem(this.AVATAR_KEY + uid) : null;
  }
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