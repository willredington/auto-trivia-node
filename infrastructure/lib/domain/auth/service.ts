export function extractUserIdFromClaims(
  claims: Record<string, string>
): string {
  if (!("sub" in claims)) {
    throw new Error("could not extract userID");
  }

  const subject = claims["sub"];

  if (!subject) {
    throw new Error("subject cannot be empty or null");
  }

  return subject;
}
