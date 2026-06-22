import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsData } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  data: AnalyticsData | null = null;
  loading = true;
  errorMessage = '';
  loginStatus = localStorage.getItem('loginStatus');

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) {
    if (this.loginStatus !== 'active') {
      this.router.navigate(['signin']);
    }
  }

  ngOnInit(): void {
    this.service.getAnalytics(10).subscribe({
      next: (d) => { this.data = d; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.errorMessage = 'Analytics could not be loaded.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  get categoryLabels(): string[] {
    return this.data ? Object.keys(this.data.categoryViews) : [];
  }

  get categoryValues(): number[] {
    return this.data ? Object.values(this.data.categoryViews) : [];
  }

  get categoryMax(): number {
    return Math.max(...this.categoryValues, 1);
  }

  barWidth(views: number): string {
    return Math.round((views / this.categoryMax) * 100) + '%';
  }
}
