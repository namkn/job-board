const apiBase = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const EMPLOYER_TOKEN_KEY = "job_board_employer_jwt";
const unauthorizedEventName = "job-board:employer-unauthorized";

export function getEmployerToken(): string | null {
  return localStorage.getItem(EMPLOYER_TOKEN_KEY);
}

export function setEmployerToken(token: string): void {
  localStorage.setItem(EMPLOYER_TOKEN_KEY, token);
}

export function clearEmployerToken(): void {
  localStorage.removeItem(EMPLOYER_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

async function parseJsonSafely(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function withAuthHeaders(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  const token = getEmployerToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
}

async function fetchApi(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`${apiBase}${path}`, withAuthHeaders(init));
  if (res.status === 401) {
    clearEmployerToken();
    window.dispatchEvent(new Event(unauthorizedEventName));
  }
  return res;
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetchApi(path, { method: "GET" });
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message =
      typeof (body as { error?: string })?.error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return body as T;
}

export async function postJson<TResponse, TBody extends JsonValue>(
  path: string,
  payload: TBody,
): Promise<TResponse> {
  const res = await fetchApi(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message =
      typeof (body as { error?: string })?.error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return body as TResponse;
}

export async function patchJson<TResponse, TBody extends JsonValue>(
  path: string,
  payload: TBody,
): Promise<TResponse> {
  const res = await fetchApi(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message =
      typeof (body as { error?: string })?.error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return body as TResponse;
}

export async function deleteJson(path: string): Promise<void> {
  const res = await fetchApi(path, { method: "DELETE" });
  if (res.status === 204) return;
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message =
      typeof (body as { error?: string })?.error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
}
