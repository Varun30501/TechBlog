import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';

@Component({
  selector: 'app-search-result',
  standalone: false,
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css']
})
export class SearchResultComponent implements OnInit {

  posts: Post[] = [];
  title = '';
  loading = false;   // false until a search is actually in flight
  errorMessage = '';

  constructor(
    private service: PostapiService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.title = params.get('postTitle') || '';
      this.posts = [];
      this.errorMessage = '';
      this.cdr.markForCheck();
      this.search();
    });
  }

  search(): void {
    const query = this.title.trim();
    if (!query) {
      this.router.navigate(['/search']);
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.service.getPostByTitle(query).subscribe({
      next: (posts: Post[]) => {
        this.posts = posts;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Error searching posts:', error);
        this.errorMessage = 'Search failed. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  imageSrc = postImageSrc;
}
