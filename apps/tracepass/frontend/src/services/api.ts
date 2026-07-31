const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? ""
)
  .trim()
  .replace(/\/+$/, "");

export function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return fetch(
    `${apiBaseUrl}${normalizedPath}`,
    options,
  );
}