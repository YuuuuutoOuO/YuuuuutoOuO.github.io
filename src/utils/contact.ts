/**
 * Anti-scraper email obfuscation utility.
 * The email address is never stored as a plain literal string in HTML or JS bundles;
 * it is assembled on demand only after an explicit user interaction.
 */
const USER_CODES = [99, 111, 114, 112, 115, 101, 48, 55, 49, 50];
const DOMAIN_CODES = [103, 109, 97, 105, 108, 46, 99, 111, 109];

export function decodeContactEmail(): string {
  const user = String.fromCharCode(...USER_CODES);
  const domain = String.fromCharCode(...DOMAIN_CODES);
  return `${user}${String.fromCharCode(64)}${domain}`;
}

export function openMailClient(): void {
  const email = decodeContactEmail();
  window.location.href = `mailto:${email}`;
}
