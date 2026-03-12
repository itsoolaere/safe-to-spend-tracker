/**
 * Returns the public-facing app URL.
 * If a custom domain is configured, always use that so email redirect
 * links (password reset, confirmation) land on the correct origin.
 */
export function getAppUrl(): string {
  const customDomain = "https://safetospend.itsoolaere.studio";
  return customDomain;
}
