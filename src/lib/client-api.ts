export async function readApiPayload<T extends { error?: string }>(
  response: Response,
  fallbackError: string,
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = (await response.text()).trim();
  const error =
    response.status === 504
      ? "The request timed out before the server finished. Please retry after a moment."
      : text || fallbackError;

  return { error } as T;
}
