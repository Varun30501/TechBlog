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

  loadPosts(): void {
    const request = this.isAdmin ? this.service.getAllPosts() : this.service.getPostsByUserId(this.userId);
    request.subscribe({
      next: (posts) => {
        this.posts = posts;
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
