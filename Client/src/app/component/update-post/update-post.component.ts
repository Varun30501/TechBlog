import { ChangeDetectorRef, Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category, Post, Tag } from '../../model/Post';
import { PostapiService } from '../../service/postapi.service';
import { postImageSrc } from '../../util/post-image';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

@Component({
  selector: 'app-update-post',
  standalone: false,
  templateUrl: './update-post.component.html',
  styleUrls: ['./update-post.component.css']
})
export class UpdatePostComponent implements OnInit, AfterViewInit, OnDestroy {

  postId = Number(this.activatedRoute.snapshot.params['postId']);
  singlePost: Post | null = null;
  categories: Category[] = [];
  selectedFile: File | null = null;
  previewUrl = '';
  categoryId = '';
  featured = false;
  saving = false;
  errorMessage = '';
  activeTab: 'write' | 'seo' = 'write';
  loginStatus = localStorage.getItem('loginStatus');
  editorReady = false;

  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' = 'PUBLISHED';
  scheduledAt  = '';
  metaTitle    = '';
  metaDescription = '';
  metaKeywords = '';
  tagsInput    = '';

  editor!: Editor;

  constructor(
    private router: Router,
    private service: PostapiService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef) {
    if (this.loginStatus !== 'active') {
      this.router.navigate(['signin']);
    }
  }

  ngOnInit(): void {
    this.service.getCategories().subscribe({
      next: (cats) => { this.categories = cats; this.cdr.markForCheck(); },
      error: () => { this.categories = []; }
    });

    this.service.getSinglePost(this.postId).subscribe({
      next: (post) => {
        this.singlePost = post;
        this.categoryId = String(post.category?.categoryId || '');
        this.featured   = Boolean(post.featured);
        this.status     = (post.status as any) || 'PUBLISHED';
        this.scheduledAt = post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '';
        this.metaTitle       = post.metaTitle       || '';
        this.metaDescription = post.metaDescription || '';
        this.metaKeywords    = post.metaKeywords    || '';
        this.tagsInput       = (post.tags || []).map((t: Tag) => t.tagName).join(', ');
        this.editorReady = true;
        this.cdr.markForCheck();
        // Populate editor after data arrives
        setTimeout(() => {
          if (this.editor && post.postContent) {
            this.editor.commands.setContent(post.postContent);
          }
        }, 0);
      },
      error: () => { this.errorMessage = 'Post could not be loaded.'; this.cdr.markForCheck(); }
    });
  }

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: document.querySelector('#tiptap-editor') as HTMLElement,
      extensions: [
        StarterKit, Underline,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: 'Edit your post here…' })
      ],
      editorProps: { attributes: { class: 'tiptap-content' } }
    });
  }

  ngOnDestroy(): void { this.editor?.destroy(); }

  get editorContent(): string { return this.editor?.getHTML() ?? ''; }

  get wordCount(): number {
    return this.editorContent
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter((w: string) => !!w)
      .length;
  }

  get postTitle(): string { return this.singlePost?.postTitle || ''; }
  set postTitle(v: string) { if (this.singlePost) this.singlePost.postTitle = v; }
  get postExcerpt(): string { return this.singlePost?.postExcerpt || ''; }
  set postExcerpt(v: string) { if (this.singlePost) this.singlePost.postExcerpt = v; }

  updatePost(): void {
    if (!this.singlePost) return;
    const content = this.editorContent;
    if (!content.trim() || content === '<p></p>') { this.errorMessage = 'Content is required.'; return; }

    const isoSchedule = this.scheduledAt ? new Date(this.scheduledAt).toISOString() : '';
    this.saving = true;
    this.errorMessage = '';

    this.service.updatePost(
      this.singlePost.postId,
      this.singlePost.postTitle,
      content,
      this.selectedFile,
      this.categoryId,
      this.featured,
      this.singlePost.postExcerpt || '',
      this.status, isoSchedule,
      this.metaTitle, this.metaDescription, this.metaKeywords,
      this.tagsInput
    ).subscribe({
      next: () => this.router.navigate(['/manage-posts']),
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Post could not be updated.';
        this.cdr.markForCheck();
      }
    });
  }

  handleFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFile = target.files?.[0] || null;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = String(reader.result); this.cdr.markForCheck(); };
      reader.readAsDataURL(this.selectedFile);
    }
  }

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
  isActive(name: string, attrs?: any): boolean { return this.editor?.isActive(name, attrs) ?? false; }
  imageSrc = postImageSrc;
}