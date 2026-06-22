import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/model/User';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-manage-roles',
  standalone: false,
  templateUrl: './manage-roles.component.html',
  styleUrls: ['./manage-roles.component.css']
})
export class ManageRolesComponent implements OnInit {

  users: User[] = [];
  loading = true;
  saving: Record<number, boolean> = {};
  message: Record<number, string> = {};
  errorMessage = '';

  loginStatus = localStorage.getItem('loginStatus');
  userRole    = localStorage.getItem('userRole');
  currentUserId = Number(localStorage.getItem('userId'));

  readonly roles = ['USER', 'EDITOR', 'ADMIN'];

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) {
    if (this.loginStatus !== 'active' || this.userRole !== 'ADMIN') {
      this.router.navigate([this.loginStatus !== 'active' ? 'signin' : 'dashboard']);
    }
  }

  ngOnInit(): void {
    this.service.getAllUsers().subscribe({
      next: (users) => { this.users = users; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.errorMessage = 'Users could not be loaded.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  changeRole(user: User, role: string): void {
    if (!user.userId) return;
    this.saving[user.userId] = true;
    this.message[user.userId] = '';
    this.service.changeUserRole(user.userId, role).subscribe({
      next: () => {
        user.role = role;
        this.saving[user.userId!] = false;
        this.message[user.userId!] = 'Updated';
        this.cdr.markForCheck();
        setTimeout(() => { this.message[user.userId!] = ''; this.cdr.markForCheck(); }, 2000);
      },
      error: (err) => {
        this.saving[user.userId!] = false;
        this.message[user.userId!] = err.error?.message || 'Failed';
        this.cdr.markForCheck();
      }
    });
  }

  roleBadgeClass(role: string): string {
    if (role === 'ADMIN')  return 'text-bg-danger';
    if (role === 'EDITOR') return 'text-bg-warning';
    return 'text-bg-secondary';
  }
}
