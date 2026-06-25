import { User } from '../model/User';

/**
 * Returns a data: URI for a user's avatar, or null if they don't have one.
 * Callers should fall back to an initials circle when this returns null —
 * see the `.avatar` / `initials()` pattern already used across the app.
 */
export function avatarImageSrc(user: Pick<User, 'avatarImage'> | null | undefined): string | null {
  if (!user || !user.avatarImage) {
    return null;
  }
  return `data:image/jpeg;base64,${user.avatarImage}`;
}