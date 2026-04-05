const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, { method: "GET" });
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message =
      typeof (body as any)?.error === "string"
        ? (body as any).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return body as T;
}

export async function postJson<TResponse, TBody extends JsonValue>(
  path: string,
  payload: TBody,
): Promise<TResponse> {
  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message =
      typeof (body as any)?.error === "string"
        ? (body as any).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return body as TResponse;
}

