import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-signin',
  standalone: false,
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {

  errorMessage = '';
  loading = false;

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('loginStatus') === 'active') {
      this.router.navigate(['dashboard']);
    }
  }

  signin(email: string, password: string): void {
    this.errorMessage = '';
    this.loading = true;

    this.service.signin(email, password).subscribe({
      next: (response) => {
        localStorage.setItem('loginStatus', 'active');
        localStorage.setItem('email', response.email || email);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('userName', response.userName);
        localStorage.setItem('userRole', response.userRole);
        this.router.navigate(['dashboard']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Wrong email address or password.';
        this.cdr.markForCheck();
      }
    });
  }
}
