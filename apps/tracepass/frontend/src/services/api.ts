import { isDemoWorkspacePath, setDemoPassportLinks } from "./demoWorkspace";
import { editorRequest, visitorRequest } from "./portfolioDemo";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? ""
)
  .trim()
  .replace(/\/+$/, "");

let adminToken = "";
let editingPortfolio = false;

export function setEditingPortfolio(editing: boolean) {
  editingPortfolio = editing;
  setDemoPassportLinks(editing);
}

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

  if (editingPortfolio) return editorRequest(normalizedPath, options);
  if (/^\/demo\/?$/.test(window.location.pathname) || window.location.pathname.startsWith("/laboratorio/publico/")) {
    return visitorRequest(normalizedPath, options, true);
  }
  if (isDemoWorkspacePath()) return visitorRequest(normalizedPath, options);
  const headers = new Headers(options?.headers);
  if (adminToken && normalizedPath.startsWith("/api/") && !normalizedPath.startsWith("/api/public/")) {
    headers.set("Authorization", "Bearer " + adminToken);
  }
  return fetch(
    `${apiBaseUrl}${normalizedPath}`,
    { ...options, headers },
  );
}