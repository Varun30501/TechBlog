import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';

@Component({
  selector: 'app-manage-category',
  standalone: false,
  templateUrl: './manage-category.component.html',
  styleUrls: ['./manage-category.component.css']
})
export class ManageCategoryComponent implements OnInit {

  categories: Category[] = [];
  draft: Partial<Category> = { categoryName: '', categoryDescription: '', displayOrder: 100 };
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('loginStatus') !== 'active') {
      this.router.navigate(['signin']);
    }
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  get editing(): boolean {
    return Boolean(this.draft.categoryId);
  }

  loadCategories(): void {
    this.service.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Categories could not be loaded.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  editCategory(category: Category): void {
    this.draft = { ...category };
    this.successMessage = '';
    this.errorMessage = '';
  }

  resetForm(): void {
    this.draft = { categoryName: '', categoryDescription: '', displayOrder: 100 };
    this.saving = false;
  }

  saveCategory(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.editing
      ? this.service.updateCategory(this.draft)
      : this.service.addCategory(this.draft);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.editing ? 'Category updated.' : 'Category added.';
        this.resetForm();
        this.loadCategories();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Category could not be saved.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteCategory(categoryId: number): void {
    if (!confirm('Delete this category?')) { return; }
    this.service.deleteCategory(categoryId).subscribe({
      next: () => {
        this.categories = this.categories.filter((c) => c.categoryId !== categoryId);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Category could not be deleted.';
        this.cdr.markForCheck();
      }
    });
  }
}
