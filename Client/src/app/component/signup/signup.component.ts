import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/model/User';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  errorMessage = '';
  loading = false;

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) {}

  saveUser(userName: string, dob: string, email: string, password: string, repassword: string, about: string): void {
    this.errorMessage = '';

    if (password !== repassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    const user = new User(null, userName, password, email, dob, about, 'USER');

    this.service.signup(user).subscribe({
      next: () => this.router.navigate(['/signin']),
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Signup failed. Please check your details.';
        this.cdr.markForCheck();
      }
    });
  }
}
