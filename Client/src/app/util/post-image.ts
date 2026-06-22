import { Post } from '../model/Post';

const PLACEHOLDER = 'assets/placeholder-post.svg';

export function postImageSrc(post: Post): string {
  if (!post.postImage || post.postImage.length === 0) {
    return PLACEHOLDER;
  }
  return `data:image/jpeg;base64,${post.postImage}`;
}
