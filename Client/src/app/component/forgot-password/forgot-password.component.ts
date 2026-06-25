import { ChangeDetectorRef, Component } from '@angular/core';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  email = '';
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private service: PostapiService,
    private cdr: ChangeDetectorRef) {}

  submit(): void {
    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }
    this.errorMessage = '';
    this.loading = true;

    this.service.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        // The backend always returns the same generic message whether or not
        // the email exists, so this branch covers both cases on purpose.
        this.loading = false;
        this.submitted = true;
        this.cdr.markForCheck();
      },
      error: () => {
        // Even on a network/server error we don't want to confirm or deny
        // whether an account exists, so we show the same confirmation state.
        this.loading = false;
        this.submitted = true;
        this.cdr.markForCheck();
      }
    });
  }
}
