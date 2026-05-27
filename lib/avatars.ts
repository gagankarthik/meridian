import { createAvatar } from "@dicebear/core";
import { lorelei, shapes } from "@dicebear/collection";

/**
 * Self-hosted DiceBear avatars — generated in-process (no runtime network
 * calls to dicebear.com). Results are memoized per seed so repeated renders
 * are cheap.
 *
 *   personAvatar  → "lorelei" illustration, used for member/user avatars
 *   projectAvatar → "shapes" mark, used for project icons
 */

const cache = new Map<string, string>();

export function personAvatar(seed: string): string {
  const key = `lorelei:${seed}`;
  let uri = cache.get(key);
  if (!uri) {
    uri = createAvatar(lorelei, { seed }).toDataUri();
    cache.set(key, uri);
  }
  return uri;
}

export function projectAvatar(seed: string): string {
  const key = `shapes:${seed}`;
  let uri = cache.get(key);
  if (!uri) {
    uri = createAvatar(shapes, { seed }).toDataUri();
    cache.set(key, uri);
  }
  return uri;
}
