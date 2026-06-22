import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnalyticsData, Category, FeedResponse, Post } from '../model/Post';
import { User } from '../model/User';

export interface BlogStats {
  posts: number;
  comments: number;
  users: number;
  categories: number;
  published: number;
  drafts: number;
  scheduled: number;
}

@Injectable({ providedIn: 'root' })
export class PostapiService {

  private baseUrl = '/api/blog';

  constructor(private http: HttpClient) { }

  // ── Posts ──
  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts`);
  }

  getFeed(query = '', categoryId?: number | string | null, page = 0, size = 9): Observable<FeedResponse<Post>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query)      { params = params.set('query', query); }
    if (categoryId) { params = params.set('categoryId', categoryId); }
    return this.http.get<FeedResponse<Post>>(`${this.baseUrl}/posts/feed`, { params });
  }

  getFeaturedPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/featured`);
  }

  getPopularPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/popular`);
  }

  getSinglePost(postId: any): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}/post/${postId}`);
  }

  getPostsByUserId(userId: any): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/post/user/${userId}`);
  }

  getDraftsByUserId(userId: any): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/post/drafts/${userId}`);
  }

  getRelatedPosts(postId: any): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/post/${postId}/related`);
  }

  postsByCategory(categoryId: any): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/${categoryId}`);
  }

  getPostByTitle(title: any): Observable<Post[]> {
    const params = new HttpParams().set('postTitle', title);
    return this.http.get<Post[]>(`${this.baseUrl}/post/search`, { params });
  }

  addPost(
    postTitle: string, content: string, image: File | null,
    categoryId: any, userId: any,
    featured = false, excerpt = '',
    status = 'PUBLISHED', scheduledAt = '',
    metaTitle = '', metaDescription = '', metaKeywords = '',
    tags = ''
  ): Observable<any> {
    const fd = new FormData();
    fd.append('postTitle', postTitle);
    fd.append('postContent', content);
    fd.append('postExcerpt', excerpt);
    fd.append('categoryId', categoryId);
    fd.append('userId', userId);
    fd.append('featured', String(featured));
    fd.append('status', status);
    if (scheduledAt)     { fd.append('scheduledAt', scheduledAt); }
    if (metaTitle)       { fd.append('metaTitle', metaTitle); }
    if (metaDescription) { fd.append('metaDescription', metaDescription); }
    if (metaKeywords)    { fd.append('metaKeywords', metaKeywords); }
    if (tags)            { fd.append('tags', tags); }
    if (image)           { fd.append('postImage', image); }
    return this.http.post(`${this.baseUrl}/post`, fd);
  }

  updatePost(
    postId: any, postTitle: string, content: string, image: File | null,
    categoryId: any, featured = false, excerpt = '',
    status = 'PUBLISHED', scheduledAt = '',
    metaTitle = '', metaDescription = '', metaKeywords = '',
    tags = ''
  ): Observable<any> {
    const fd = new FormData();
    fd.append('postId', postId);
    fd.append('postTitle', postTitle);
    fd.append('postContent', content);
    fd.append('postExcerpt', excerpt);
    fd.append('categoryId', categoryId);
    fd.append('featured', String(featured));
    fd.append('status', status);
    if (scheduledAt)     { fd.append('scheduledAt', scheduledAt); }
    if (metaTitle)       { fd.append('metaTitle', metaTitle); }
    if (metaDescription) { fd.append('metaDescription', metaDescription); }
    if (metaKeywords)    { fd.append('metaKeywords', metaKeywords); }
    if (tags)            { fd.append('tags', tags); }
    if (image)           { fd.append('postImage', image); }
    return this.http.put(`${this.baseUrl}/post`, fd);
  }

  deletePost(postId: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}/post/${postId}`);
  }

  // ── Categories ──
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  addCategory(category: Partial<Category>): Observable<any> {
    return this.http.post(`${this.baseUrl}/category`, category);
  }

  updateCategory(category: Partial<Category>): Observable<any> {
    return this.http.put(`${this.baseUrl}/category`, category);
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/category/${categoryId}`);
  }

  // ── Comments ──
  getCommentsForPost(postId: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/comment/${postId}`);
  }

  addComment(postId: number, userId: number, content: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/comment/${postId}/${userId}`,
      JSON.stringify(content), { headers: { 'content-type': 'application/json' } });
  }

  getAllComments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/comments`);
  }

  getCommentsByUserId(userId: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/comment/user/${userId}`);
  }

  deleteCommentByCommentId(commentId: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comment/${commentId}`);
  }

  getCommentBycommentId(commentId: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/getcomment/${commentId}`);
  }

  updateComment(comment: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/comment`, JSON.stringify(comment),
      { headers: { 'content-type': 'application/json' } });
  }

  // ── Users ──
  signup(user: User): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, JSON.stringify(user),
      { headers: { 'content-type': 'application/json' } });
  }

  signin(email: any, password: any): Observable<any> {
    const params = new HttpParams().set('email', email).set('password', password);
    return this.http.get(`${this.baseUrl}/login`, { params });
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }

  getUserById(userId: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/${userId}`);
  }

  deleteUserById(userId: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}/user/${userId}`);
  }

  changeUserRole(userId: number, role: string): Observable<any> {
    const params = new HttpParams().set('role', role);
    return this.http.put(`${this.baseUrl}/user/${userId}/role`, null, { params });
  }

  // ── Stats & Analytics ──
  getStats(): Observable<BlogStats> {
    return this.http.get<BlogStats>(`${this.baseUrl}/stats`);
  }

  getAnalytics(topN = 10): Observable<AnalyticsData> {
    const params = new HttpParams().set('topN', topN);
    return this.http.get<AnalyticsData>(`${this.baseUrl}/analytics`, { params });
  }
}