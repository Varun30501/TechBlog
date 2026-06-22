import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Post } from 'src/app/model/Post';
import { User } from 'src/app/model/User';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  profile: User | null = null;
  posts: Post[] = [];
  loading = true;
  saving = false;
  editMode = false;
  successMessage = '';
  errorMessage = '';

  /* avatar */
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  readonly AVATAR_KEY = 'userAvatar_';

  /* structured edit fields */
  editName        = '';
  editTitle       = '';   /* e.g. "Senior Software Engineer" */
  editOrg         = '';   /* e.g. "Google" */
  editExpertise   = '';   /* e.g. "Java, Spring Boot, Distributed Systems" */
  editQualification = ''; /* e.g. "M.Sc. Computer Science, IIT Madras" */
  editBio         = '';   /* short personal bio */
  editLinkedIn    = '';
  editWebsite     = '';
  editDob         = '';

  imageSrc = postImageSrc;

  constructor(
    private service: PostapiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (!userId || localStorage.getItem('loginStatus') !== 'active') {
      this.router.navigate(['/signin']);
      return;
    }
    this.loadProfile(userId);
  }

  private loadProfile(userId: string): void {
    this.profile = new User(
      Number(userId),
      localStorage.getItem('userName') || '',
      '',
      localStorage.getItem('userEmail') || '',
      localStorage.getItem('userDob') || '',
      localStorage.getItem('userAbout') || '',
      localStorage.getItem('userRole') || 'NORMAL'
    );
    this.avatarPreview = localStorage.getItem(this.AVATAR_KEY + userId);

    this.service.getPostsByUserId(userId).subscribe({
      next: (posts) => {
        this.posts = posts.filter(p => !p.status || p.status === 'PUBLISHED');
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.posts = []; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  /* stored helpers */
  get storedTitle():         string { return localStorage.getItem('userTitle')         || ''; }
  get storedOrg():           string { return localStorage.getItem('userOrg')           || ''; }
  get storedExpertise():     string { return localStorage.getItem('userExpertise')     || ''; }
  get storedQualification(): string { return localStorage.getItem('userQualification') || ''; }
  get storedBio():           string { return localStorage.getItem('userBio')           || ''; }
  get storedLinkedIn():      string { return localStorage.getItem('userLinkedIn')      || ''; }
  get storedWebsite():       string { return localStorage.getItem('userWebsite')       || ''; }

  get displayTagline(): string {
    const parts = [this.storedTitle, this.storedOrg].filter(Boolean);
    return parts.join(' · ');
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.errorMessage = 'Image must be under 2 MB.'; return; }
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; this.cdr.markForCheck(); };
    reader.readAsDataURL(file);
  }

  startEdit(): void {
    if (!this.profile) return;
    this.editName          = this.profile.userName;
    this.editDob           = this.profile.dob;
    this.editTitle         = this.storedTitle;
    this.editOrg           = this.storedOrg;
    this.editExpertise     = this.storedExpertise;
    this.editQualification = this.storedQualification;
    this.editBio           = this.storedBio;
    this.editLinkedIn      = this.storedLinkedIn;
    this.editWebsite       = this.storedWebsite;
    this.editMode = true;
    this.successMessage = '';
    this.errorMessage   = '';
  }

  cancelEdit(): void {
    this.editMode = false;
    this.avatarFile = null;
    this.avatarPreview = localStorage.getItem(this.AVATAR_KEY + String(this.profile?.userId));
  }

  saveProfile(): void {
    if (!this.profile) return;
    this.saving = true;
    const userId = String(this.profile.userId);

    if (this.avatarFile && this.avatarPreview) {
      localStorage.setItem(this.AVATAR_KEY + userId, this.avatarPreview);
    }

    localStorage.setItem('userName',          this.editName);
    localStorage.setItem('userDob',           this.editDob);
    localStorage.setItem('userTitle',         this.editTitle);
    localStorage.setItem('userOrg',           this.editOrg);
    localStorage.setItem('userExpertise',     this.editExpertise);
    localStorage.setItem('userQualification', this.editQualification);
    localStorage.setItem('userBio',           this.editBio);
    localStorage.setItem('userLinkedIn',      this.editLinkedIn);
    localStorage.setItem('userWebsite',       this.editWebsite);

    this.profile.userName = this.editName;
    this.profile.dob      = this.editDob;
    this.profile.about    = this.editBio;

    this.saving = false;
    this.editMode = false;
    this.successMessage = 'Profile updated successfully.';
    this.avatarFile = null;
    this.cdr.markForCheck();
    setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 3500);
  }

  get joinYear(): string { return new Date().getFullYear().toString(); }
  get totalViews(): number { return this.posts.reduce((sum, p) => sum + (p.viewCount || 0), 0); }
  trackPost(_: number, post: Post): number { return post.postId; }
}
