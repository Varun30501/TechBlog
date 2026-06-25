import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Post } from 'src/app/model/Post';
import { User } from 'src/app/model/User';
import { PostapiService } from 'src/app/service/postapi.service';
import { postImageSrc } from 'src/app/util/post-image';
import { avatarImageSrc } from 'src/app/util/avatar-image';

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

  /* avatar — stored server-side on the User entity, not localStorage, so
     it shows up correctly for OTHER users viewing this person's posts/comments */
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  avatarUploading = false;

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
  avatarSrc = avatarImageSrc;

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
    // Start from localStorage so the page isn't blank while the network call is in flight.
    this.profile = new User(
      Number(userId),
      localStorage.getItem('userName') || '',
      '',
      localStorage.getItem('userEmail') || '',
      localStorage.getItem('userDob') || '',
      localStorage.getItem('userAbout') || '',
      localStorage.getItem('userRole') || 'NORMAL'
    );

    // Then refresh from the backend — this is the source of truth for the avatar,
    // since avatars are stored server-side and must be visible to OTHER users too.
    this.service.getUserById(userId).subscribe({
      next: (user: User) => {
        if (this.profile) {
          this.profile.userName = user.userName;
          this.profile.dob = user.dob;
          this.profile.about = user.about;
          this.profile.avatarImage = user.avatarImage;
        }
        this.avatarPreview = this.avatarSrc(user);
        this.cdr.markForCheck();
      },
      error: () => { /* fall back silently to the localStorage-derived profile above */ }
    });

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
    if (!file || !this.profile?.userId) return;
    if (file.size > 2 * 1024 * 1024) { this.errorMessage = 'Image must be under 2 MB.'; return; }

    this.avatarFile = file;
    // Instant local preview while the upload is in flight.
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; this.cdr.markForCheck(); };
    reader.readAsDataURL(file);

    this.avatarUploading = true;
    this.service.uploadAvatar(this.profile.userId, file).subscribe({
      next: (user: User) => {
        if (this.profile) { this.profile.avatarImage = user.avatarImage; }
        this.avatarPreview = this.avatarSrc(user);
        this.avatarUploading = false;
        this.avatarFile = null;
        this.successMessage = 'Profile photo updated.';
        this.cdr.markForCheck();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 3500);
      },
      error: () => {
        this.avatarUploading = false;
        this.errorMessage = 'Photo could not be uploaded. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  removeAvatar(): void {
    if (!this.profile?.userId) return;
    this.avatarUploading = true;
    this.service.deleteAvatar(this.profile.userId).subscribe({
      next: () => {
        if (this.profile) { this.profile.avatarImage = undefined; }
        this.avatarPreview = null;
        this.avatarUploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.avatarUploading = false;
        this.errorMessage = 'Photo could not be removed. Please try again.';
        this.cdr.markForCheck();
      }
    });
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
    this.avatarPreview = this.avatarSrc(this.profile);
  }

  saveProfile(): void {
    if (!this.profile?.userId) return;
    this.saving = true;

    localStorage.setItem('userName',          this.editName);
    localStorage.setItem('userDob',           this.editDob);
    localStorage.setItem('userTitle',         this.editTitle);
    localStorage.setItem('userOrg',           this.editOrg);
    localStorage.setItem('userExpertise',     this.editExpertise);
    localStorage.setItem('userQualification', this.editQualification);
    localStorage.setItem('userBio',           this.editBio);
    localStorage.setItem('userLinkedIn',      this.editLinkedIn);
    localStorage.setItem('userWebsite',       this.editWebsite);

    // Persist the fields the backend actually has columns for.
    // dob is a LocalDate on the backend, so we omit it entirely when blank
    // rather than sending "" (which Jackson can't parse as a LocalDate).
    const payload: Partial<User> = { userName: this.editName, about: this.editBio };
    if (this.editDob) { payload.dob = this.editDob; }

    this.service.updateUser(this.profile.userId, payload).subscribe({
      next: (user: User) => {
        if (this.profile) {
          this.profile.userName = user.userName;
          this.profile.dob = user.dob;
          this.profile.about = user.about;
        }
        this.saving = false;
        this.editMode = false;
        this.successMessage = 'Profile updated successfully.';
        this.cdr.markForCheck();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 3500);
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Profile could not be saved. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  get joinYear(): string { return new Date().getFullYear().toString(); }
  get totalViews(): number { return this.posts.reduce((sum, p) => sum + (p.viewCount || 0), 0); }
  trackPost(_: number, post: Post): number { return post.postId; }
}