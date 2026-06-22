import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Comment } from '../../model/Comment';
import { PostapiService } from '../../service/postapi.service';

@Component({
  selector: 'app-update-comment',
  standalone: false,
  templateUrl: './update-comment.component.html',
  styleUrls: ['./update-comment.component.css']
})
export class UpdateCommentComponent implements OnInit {

  comment: Comment | null = null;
  commentId = Number(this.activatedRoute.snapshot.params['commentId']);
  saving = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private service: PostapiService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('loginStatus') !== 'active') {
      this.router.navigate(['signin']);
    }
  }

  ngOnInit(): void {
    this.service.getCommentBycommentId(this.commentId).subscribe({
      next: (response) => {
        this.comment = response;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Comment could not be loaded.';
        this.cdr.markForCheck();
      }
    });
  }

  updateComment(): void {
    if (!this.comment) { return; }
    this.saving = true;
    this.service.updateComment(this.comment).subscribe({
      next: () => this.router.navigate(['manage-comments']),
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Comment could not be updated.';
        this.cdr.markForCheck();
      }
    });
  }
}
