import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Post } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';

@Component({
  selector: 'app-manage-posts',
  standalone: false,
  templateUrl: './manage-posts.component.html',
  styleUrls: ['./manage-posts.component.css']
})
export class ManagePostsComponent implements OnInit {

  posts: Post[] = [];
  userRole = localStorage.getItem('userRole');
  loginStatus = localStorage.getItem('loginStatus');
  userId = Number(localStorage.getItem('userId'));
  loading = true;
  errorMessage = '';

  /* client-side pagination — this endpoint returns the full list, so we
     page through the already-fetched array rather than hitting the server again */
  page = 0;
  pageSize = 10;

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) {
    if (this.loginStatus !== 'active') {
      this.router.navigate(['signin']);
    }
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  get isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.posts.length / this.pageSize));
  }

  get pagedPosts(): Post[] {
    const start = this.page * this.pageSize;
    return this.posts.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.page = page;
    this.cdr.markForCheck();
  }

  loadPosts(): void {
    const request = this.isAdmin ? this.service.getAllPosts() : this.service.getPostsByUserId(this.userId);
    request.subscribe({
      next: (posts) => {
        this.posts = posts;
        this.page = 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Posts could not be loaded.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  deletePost(postId: number): void {
    if (!confirm('Delete this post?')) { return; }
    this.service.deletePost(postId).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.postId !== postId);
        if (this.page > 0 && this.page >= this.totalPages) { this.page = this.totalPages - 1; }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Post could not be deleted.';
        this.cdr.markForCheck();
      }
    });
  }

  imageSrc = postImageSrc;
}