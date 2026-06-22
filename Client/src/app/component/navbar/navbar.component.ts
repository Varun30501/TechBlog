import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Category } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  categories: Category[] = [];

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.service.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.markForCheck();
      },
      error: () => { this.categories = []; }
    });
  }

  get isSignedIn(): boolean {
    return localStorage.getItem('loginStatus') === 'active';
  }

  get userName(): string {
    return localStorage.getItem('userName') || 'Writer';
  }

  search(term: string): void {
    const query = term.trim();
    if (!query) { return; }
    this.router.navigate(['/search-result'], { queryParams: { postTitle: query } });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/signin']);
  }
}
