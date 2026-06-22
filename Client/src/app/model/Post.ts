export interface Category {
  categoryId: number;
  categoryName: string;
  categoryDescription?: string;
  displayOrder?: number;
}

export interface Tag {
  tagId: number;
  tagName: string;
  tagSlug?: string;
}

export interface PostAuthor {
  userId: number;
  userName: string;
  userEmail?: string;
  about?: string;
  role?: string;
}

export interface Post {
  postId: number;
  postTitle: string;
  postSlug?: string;
  postContent: string;
  postExcerpt?: string;
  postImage: string;
  postCreation?: string;
  postUpdation?: string;
  featured?: boolean;
  viewCount?: number;
  readingMinutes?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  scheduledAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: Tag[];
  category?: Category;
  user?: PostAuthor;
}

export interface FeedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AnalyticsData {
  topPosts: Post[];
  categoryViews: Record<string, number>;
  totalViews: number;
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  published: number;
  drafts: number;
  scheduled: number;
}