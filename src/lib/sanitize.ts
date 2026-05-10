/**
 * HTML/XSS Sanitization utilities
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes script tags, event handlers, and javascript: protocols
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URIs (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, '');

  return sanitized;
}

/**
 * Escape HTML entities to prevent XSS
 * Use this for displaying user-generated content
 */
export function escapeHTML(text: string): string {
  if (!text) return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize user input for search queries
 * Prevents SQL injection and XSS in search contexts
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  // Remove potential SQL injection patterns
  let sanitized = query.replace(/['";\\]/g, '');

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Limit length
  sanitized = sanitized.substring(0, 200);

  return sanitized.trim();
}

/**
 * Validate and sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return '';
  }

  return url.trim();
}

/**
 * Strip all HTML tags from text
 * Use for plain text contexts where no HTML should be allowed
 */
export function stripHTML(html: string): string {
  if (!html) return '';

  return html.replace(/<[^>]*>/g, '').trim();
}
