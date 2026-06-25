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

  /* client-side pagination — /users returns the full list */
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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.users.length / this.pageSize));
  }

  get pagedUsers(): User[] {
    const start = this.page * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.page = page;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.service.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.page = 0;
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
        if (this.page > 0 && this.page >= this.totalPages) { this.page = this.totalPages - 1; }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'User could not be deleted.';
        this.cdr.markForCheck();
      }
    });
  }
}