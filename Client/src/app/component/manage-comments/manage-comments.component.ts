import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Comment } from 'src/app/model/Comment';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-manage-comments',
  standalone: false,
  templateUrl: './manage-comments.component.html',
  styleUrls: ['./manage-comments.component.css']
})
export class ManageCommentsComponent implements OnInit {

  comments: Comment[] = [];
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
    this.loadComments();
  }

  get isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  loadComments(): void {
    const request = this.isAdmin ? this.service.getAllComments() : this.service.getCommentsByUserId(this.userId);
    request.subscribe({
      next: (comments) => {
        this.comments = comments;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Comments could not be loaded.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteComment(commentId: number | null): void {
    if (!commentId || !confirm('Delete this comment?')) { return; }
    this.service.deleteCommentByCommentId(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter((c) => c.commentId !== commentId);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Comment could not be deleted.';
        this.cdr.markForCheck();
      }
    });
  }
}
