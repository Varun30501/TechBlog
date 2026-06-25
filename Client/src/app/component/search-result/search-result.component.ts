import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';

@Component({
  selector: 'app-search-result',
  standalone: false,
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css']
})
export class SearchResultComponent implements OnInit {

  posts: Post[] = [];
  title = '';
  tagId: number | null = null;
  tagName = '';
  loading = false;   // false until a search is actually in flight
  errorMessage = '';

  page = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private service: PostapiService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.title = params.get('postTitle') || '';
      this.tagId = params.get('tagId') ? Number(params.get('tagId')) : null;
      this.tagName = params.get('tagName') || '';
      this.page = 0;
      this.posts = [];
      this.errorMessage = '';
      this.cdr.markForCheck();
      this.search();
    });
  }

  /** Header copy adapts to whether this is a text search or a tag browse */
  get resultsLabel(): string {
    if (this.tagName) { return `Posts tagged #${this.tagName}`; }
    return `Results for "${this.title}"`;
  }

  search(): void {
    const query = this.title.trim();
    if (!query && !this.tagId) {
      this.router.navigate(['/search']);
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.service.getFeed(query, null, this.tagId, this.page, this.pageSize).subscribe({
      next: (response) => {
        this.posts = response.content || [];
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Error searching posts:', error);
        this.errorMessage = 'Search failed. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.search();
    document.getElementById('search-results-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  imageSrc = postImageSrc;
}