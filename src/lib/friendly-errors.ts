/**
 * Convert technical error messages to user-friendly ones
 */
export function toFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Database errors (check before network errors since "connection pool" contains "connection")
  if (
    lowerMessage.includes("database") ||
    lowerMessage.includes("prisma") ||
    lowerMessage.includes("connection pool") ||
    lowerMessage.includes("query")
  ) {
    return "The system is temporarily unavailable. Please try again in a moment.";
  }

  // Network errors
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("internet")
  ) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Authentication errors
  if (
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("invalid admin") ||
    lowerMessage.includes("authentication") ||
    lowerMessage.includes("auth")
  ) {
    return "Access denied. Please check your credentials and try again.";
  }

  // Validation errors
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return "The information provided is incomplete or incorrect. Please review and try again.";
  }

  // File upload errors
  if (lowerMessage.includes("file") || lowerMessage.includes("upload")) {
    return "There was a problem uploading your file. Please check the file and try again.";
  }

  // Storage errors
  if (lowerMessage.includes("storage") || lowerMessage.includes("s3") || lowerMessage.includes("supabase")) {
    return "Unable to save the file. Please try again.";
  }

  // Timeout errors
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "The request took too long. Please try again.";
  }

  // Server errors (500)
  if (lowerMessage.includes("500") || lowerMessage.includes("internal server")) {
    return "Something went wrong on our end. Please try again.";
  }

  // Rate limiting
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many requests")) {
    return "You're trying too fast. Please wait a moment and try again.";
  }

  // Generic fallback
  return "Something unexpected happened. Please try again or contact support if the problem persists.";
}

/**
 * Wrap an async operation with user-friendly error handling
 */
export async function withFriendlyErrors<T>(
  operation: () => Promise<T>,
  customMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(customMessage || toFriendlyError(error));
  }
}
