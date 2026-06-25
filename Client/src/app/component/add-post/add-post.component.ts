import { ChangeDetectorRef, Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from 'src/app/model/Post';
import { PostapiService } from 'src/app/service/postapi.service';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

@Component({
  selector: 'app-add-post',
  standalone: false,
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.css']
})
export class AddPostComponent implements OnInit, AfterViewInit, OnDestroy {

  categories: Category[] = [];
  selectedFile: File | null = null;
  previewUrl = '';
  saving = false;
  message = '';
  errorMessage = '';
  activeTab: 'write' | 'seo' = 'write';

  // form fields
  postTitle    = '';
  postExcerpt  = '';
  categoryId   = '';
  featured     = false;
  showNewCategoryForm = false;
  newCategoryName = '';
  newCategoryDescription = '';
  savingCategory = false;
  categoryError = '';
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' = 'PUBLISHED';
  scheduledAt  = '';
  metaTitle    = '';
  metaDescription = '';
  metaKeywords = '';
  tagsInput    = '';

  editor!: Editor;

  loginStatus = localStorage.getItem('loginStatus');

  constructor(
    private router: Router,
    private service: PostapiService,
    private cdr: ChangeDetectorRef) {
    if (this.loginStatus !== 'active') {
      this.router.navigate(['signin']);
    }
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(selectId?: number): void {
    this.service.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (selectId) { this.categoryId = String(selectId); }
        this.cdr.markForCheck();
      },
      error: () => { this.categories = []; }
    });
  }

  onCategorySelectChange(): void {
    if (this.categoryId === '__new__') {
      this.showNewCategoryForm = true;
      this.categoryId = '';
    }
  }

  cancelNewCategory(): void {
    this.showNewCategoryForm = false;
    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.categoryError = '';
  }

  createCategory(): void {
    this.categoryError = '';
    if (!this.newCategoryName.trim()) {
      this.categoryError = 'Please enter a category name.';
      return;
    }
    this.savingCategory = true;
    this.service.addCategory({
      categoryName: this.newCategoryName.trim(),
      categoryDescription: this.newCategoryDescription.trim(),
      displayOrder: 100
    }).subscribe({
      next: (res: any) => {
        this.savingCategory = false;
        this.showNewCategoryForm = false;
        const createdName = this.newCategoryName.trim();
        this.newCategoryName = '';
        this.newCategoryDescription = '';
        // Reload categories then select the newly created one by name
        this.service.getCategories().subscribe({
          next: (cats) => {
            this.categories = cats;
            const created = cats.find(c => c.categoryName.toLowerCase() === createdName.toLowerCase());
            if (created) { this.categoryId = String(created.categoryId); }
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.savingCategory = false;
        this.categoryError = err.error?.message || 'Category could not be created.';
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: document.querySelector('#tiptap-editor') as HTMLElement,
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: 'Write your post here…' })
      ],
      editorProps: {
        attributes: { class: 'tiptap-content' }
      }
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  get editorContent(): string {
    return this.editor?.getHTML() ?? '';
  }

  get wordCount(): number {
    return this.editorContent
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter((w: string) => !!w)
      .length;
  }

  addPost(): void {
    this.message = '';
    this.errorMessage = '';
    const content = this.editorContent;
    const userId  = localStorage.getItem('userId');

    if (!this.postTitle.trim())  { this.errorMessage = 'Please enter a post title.'; return; }
    if (!content.trim() || content === '<p></p>') { this.errorMessage = 'Please enter post content.'; return; }
    if (!this.categoryId)        { this.errorMessage = 'Please choose a category.'; return; }
    if (!userId)                 { this.router.navigate(['signin']); return; }
    if (this.status === 'SCHEDULED' && !this.scheduledAt) {
      this.errorMessage = 'Please set a schedule date/time.'; return;
    }

    const isoSchedule = this.scheduledAt
      ? new Date(this.scheduledAt).toISOString()
      : '';

    this.saving = true;
    this.service.addPost(
      this.postTitle, content, this.selectedFile,
      this.categoryId, userId,
      this.featured, this.postExcerpt,
      this.status, isoSchedule,
      this.metaTitle, this.metaDescription, this.metaKeywords,
      this.tagsInput
    ).subscribe({
      next: () => {
        this.saving = false;
        if (this.status === 'DRAFT') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/manage-posts']);
        }
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Post could not be saved.';
        this.cdr.markForCheck();
      }
    });
  }

  handleFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFile = target.files?.[0] || null;
    this.previewUrl = '';
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = String(reader.result); this.cdr.markForCheck(); };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // TipTap toolbar helpers
  toggleBold()        { this.editor.chain().focus().toggleBold().run(); }
  toggleItalic()      { this.editor.chain().focus().toggleItalic().run(); }
  toggleUnderline()   { this.editor.chain().focus().toggleUnderline().run(); }
  toggleCode()        { this.editor.chain().focus().toggleCode().run(); }
  toggleCodeBlock()   { this.editor.chain().focus().toggleCodeBlock().run(); }
  toggleBulletList()  { this.editor.chain().focus().toggleBulletList().run(); }
  toggleOrderedList() { this.editor.chain().focus().toggleOrderedList().run(); }
  toggleBlockquote()  { this.editor.chain().focus().toggleBlockquote().run(); }
  setH(level: 2 | 3) { this.editor.chain().focus().toggleHeading({ level }).run(); }

  setLink(): void {
    const url = prompt('Enter URL:');
    if (url) { this.editor.chain().focus().setLink({ href: url }).run(); }
  }

  isActive(name: string, attrs?: any): boolean {
    return this.editor?.isActive(name, attrs) ?? false;
  }
}