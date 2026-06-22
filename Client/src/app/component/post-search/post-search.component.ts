import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-post-search',
  standalone: false,
  templateUrl: './post-search.component.html',
  styleUrls: ['./post-search.component.css']
})
export class PostSearchComponent implements OnInit {

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
      error: () => {
        this.categories = [];
      }
    });
  }

  postSearch(title: string): void {
    const query = title.trim();
    if (!query) { return; }
    this.router.navigate(['/search-result'], { queryParams: { postTitle: query } });
  }
}
