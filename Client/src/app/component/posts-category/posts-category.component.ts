import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Category, Post } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';

@Component({
  selector: 'app-posts-category',
  standalone: false,
  templateUrl: './posts-category.component.html',
  styleUrls: ['./posts-category.component.css']
})
export class PostsCategoryComponent implements OnInit {

  categoryId: number | null = null;
  category: Category | null = null;
  posts: Post[] = [];
  loading = true;
  errorMessage = '';

  page = 0;
  pageSize = 12;
  totalPages = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private service: PostapiService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.categoryId = Number(params.get('categoryId'));
      this.posts = [];
      this.category = null;
      this.page = 0;
      this.loading = true;
      this.errorMessage = '';
      this.cdr.markForCheck();
      this.loadCategoryPosts();
    });
  }

  loadCategoryPosts(): void {
    if (!this.categoryId) { return; }

    this.service.getFeed('', this.categoryId, null, this.page, this.pageSize).subscribe({
      next: (response) => {
        this.posts = response.content || [];
        this.totalPages = response.totalPages || 0;
        this.category = this.posts[0]?.category || this.category;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading category posts:', error);
        this.errorMessage = 'Could not load posts for this category.';
        this.posts = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.service.getCategories().subscribe({
      next: (categories) => {
        this.category = categories.find((c) => c.categoryId === this.categoryId) || this.category;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadCategoryPosts();
    document.getElementById('category-posts-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  imageSrc = postImageSrc;
}