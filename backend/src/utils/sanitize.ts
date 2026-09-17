/**
 * Sanitization and regex escaping utilities
 */

/**
 * Escapes special regex characters to prevent Regular Expression Denial of Service (ReDoS)
 * or unintended regex pattern interpretation.
 */
export const escapeRegex = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitizes input to ensure it is a safe scalar string.
 * Rejects objects/arrays to prevent NoSQL Operator Injection (e.g. { $ne: null }).
 */
export const sanitizeString = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim();
};
