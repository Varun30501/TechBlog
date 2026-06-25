import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  success = false;
  errorMessage = '';
  /** true once we know the link itself is missing/malformed, before any submit attempt */
  missingToken = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PostapiService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.missingToken = true;
    }
  }

  submit(): void {
    this.errorMessage = '';

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.service.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'This reset link is invalid or has expired.';
        this.cdr.markForCheck();
      }
    });
  }

  goToSignin(): void {
    this.router.navigate(['/signin']);
  }
}
