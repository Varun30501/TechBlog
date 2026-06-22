import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogStats, PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  loginStatus = localStorage.getItem('loginStatus');
  userRole = localStorage.getItem('userRole');
  userName = localStorage.getItem('userName') || 'Writer';
  stats: BlogStats = { posts: 0, comments: 0, users: 0, categories: 0, published: 0, drafts: 0, scheduled: 0 };

  constructor(
    private router: Router,
    private service: PostapiService,
    private cdr: ChangeDetectorRef) {
    if (this.loginStatus !== 'active') {
      this.router.navigate(['signin']);
    }
  }

  ngOnInit(): void {
    this.service.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.markForCheck();
      },
      error: () => {
        this.stats = { posts: 0, comments: 0, users: 0, categories: 0, published: 0, drafts: 0, scheduled: 0 };
        this.cdr.markForCheck();
      }
    });
  }

  get isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['signin']);
  }
}
