import { isDemoWorkspacePath, requestDemoWorkspace } from "./demoWorkspace";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? ""
)
  .trim()
  .replace(/\/+$/, "");

let adminToken = "";

export function setAdminToken(token: string) {
  adminToken = token;
}

export function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  if (isDemoWorkspacePath()) return requestDemoWorkspace(normalizedPath, options);
  const headers = new Headers(options?.headers);
  if (adminToken && normalizedPath.startsWith("/api/") && !normalizedPath.startsWith("/api/public/")) {
    headers.set("Authorization", "Bearer " + adminToken);
  }
  return fetch(
    `${apiBaseUrl}${normalizedPath}`,
    { ...options, headers },
  );
}