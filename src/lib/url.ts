/**
 * Returns the public-facing app URL.
 * Inside the Lovable preview iframe, window.location.origin is the internal
 * .lovableproject.com domain. We map it to the public .lovable.app URL so
 * that email redirect links land on the correct origin (with working SPA
 * routing and the same localStorage as the user's session).
 */
export function getAppUrl(): string {
  const origin = window.location.origin;
  const match = origin.match(
    /^https:\/\/([a-f0-9-]+)\.lovableproject\.com$/
  );
  if (match) {
    return `https://id-preview--${match[1]}.lovable.app`;
  }
  return origin;
}
