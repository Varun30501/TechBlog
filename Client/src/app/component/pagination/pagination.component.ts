import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Generic page-number control, reused across the public feed (server-side
 * paging via /posts/feed) and the admin tables (client-side paging over an
 * already-fetched array). `page` is always 0-indexed to match Spring Data's
 * Page<T>; the template adds 1 for display only.
 */
@Component({
  selector: 'app-pagination',
  standalone: false,
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {

  @Input() page = 0;            // 0-indexed current page
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  /** Windowed page numbers around the current page, e.g. [3,4,5,6,7] */
  get visiblePages(): number[] {
    const windowSize = 5;
    let start = Math.max(0, this.page - Math.floor(windowSize / 2));
    const end = Math.min(this.totalPages, start + windowSize);
    start = Math.max(0, end - windowSize);
    const pages: number[] = [];
    for (let i = start; i < end; i++) { pages.push(i); }
    return pages;
  }

  get hasPrev(): boolean { return this.page > 0; }
  get hasNext(): boolean { return this.page < this.totalPages - 1; }

  goTo(page: number): void {
    if (page < 0 || page > this.totalPages - 1 || page === this.page) { return; }
    this.pageChange.emit(page);
  }
}
