import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/model/User';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-manage-users',
  standalone: false,
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {

  users: User[] = [];
  loginStatus = localStorage.getItem('loginStatus');
  userRole = localStorage.getItem('userRole');
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
    this.service.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Users could not be loaded.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteUser(userId: number | null): void {
    if (!userId || !confirm('Delete this user?')) { return; }
    this.service.deleteUserById(userId).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.userId !== userId);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'User could not be deleted.';
        this.cdr.markForCheck();
      }
    });
  }
}
