import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Category, Post } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  allPosts: Post[] = [];
  featuredPosts: Post[] = [];
  popularPosts: Post[] = [];
  categories: Category[] = [];
  loading = true;
  errorMessage = '';

  /* pagination over the main feed (0-indexed to match Spring's Page<T>) */
  page = 0;
  pageSize = 12;
  totalPages = 0;

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadHome();
  }

  /** Only PUBLISHED posts are visible to general viewers */
  get publishedPosts(): Post[] {
    return this.allPosts.filter(p => !p.status || p.status === 'PUBLISHED');
  }

  /** Featured posts: prefer API result, fall back to filtering published posts */
  get resolvedFeaturedPosts(): Post[] {
    if (this.featuredPosts.length > 0) {
      return this.featuredPosts.filter(p => !p.status || p.status === 'PUBLISHED');
    }
    return this.publishedPosts.filter(p => p.featured);
  }

  /** Posts for "New on TechBlog" — published, non-featured */
  get newPosts(): Post[] {
    const featuredIds = new Set(this.resolvedFeaturedPosts.map(p => p.postId));
    return this.publishedPosts.filter(p => !featuredIds.has(p.postId));
  }

  loadHome(): void {
    this.loading = true;
    this.errorMessage = '';

    this.service.getFeed('', null, null, this.page, this.pageSize).subscribe({
      next: (response) => {
        this.allPosts = response.content || [];
        this.totalPages = response.totalPages || 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading feed:', error);
        this.errorMessage = 'The blog API is not available yet.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.service.getFeaturedPosts().subscribe({
      next: (posts) => {
        this.featuredPosts = posts;
        this.cdr.markForCheck();
      },
      error: () => { this.featuredPosts = []; }
    });

    this.service.getPopularPosts().subscribe({
      next: (posts) => {
        this.popularPosts = posts.filter(p => !p.status || p.status === 'PUBLISHED');
        this.cdr.markForCheck();
      },
      error: () => { this.popularPosts = []; }
    });

    this.service.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.markForCheck();
      },
      error: () => { this.categories = []; }
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadHome();
    // Jump back to the feed section rather than the very top of the page.
    document.getElementById('latest-posts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  search(term: string): void {
    const query = term.trim();
    if (!query) { return; }
    this.router.navigate(['/search-result'], { queryParams: { postTitle: query } });
  }

  imageSrc = postImageSrc;

  trackPost(_: number, post: Post): number {
    return post.postId;
  }
}