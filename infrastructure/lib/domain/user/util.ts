export function makeUserKey({ userId }: { userId: string }) {
  return `user:${userId}`;
}
