import { Post, PostAuthor } from './Post';

export class Comment {
  commentId: number | null;
  content: string;
  commentCreation?: string;
  post?: Post;
  user?: PostAuthor;
  parentCommentId?: number | null;
  likeCount?: number;
  likedByCurrentUser?: boolean;

  constructor(commentId:any, content:any) {
    this.commentId = commentId || null;
    this.content = content;
  }
}