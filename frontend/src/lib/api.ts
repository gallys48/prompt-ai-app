import { config } from "@/lib/config";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  skipAuthRefresh?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super("API request failed");
    this.status = status;
    this.detail = detail;
  }
}

async function parseResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  const hasJson = contentType?.includes("application/json");

  if (!hasJson) {
    return null;
  }

  return response.json();
}

function shouldTryRefresh(path: string, options: ApiRequestOptions): boolean {
  if (options.skipAuthRefresh) {
    return false;
  }

  if (path.startsWith("/auth/login")) {
    return false;
  }

  if (path.startsWith("/auth/register")) {
    return false;
  }

  if (path.startsWith("/auth/refresh")) {
    return false;
  }

  if (path.startsWith("/auth/logout")) {
    return false;
  }

  return true;
}

async function refreshAuthSession(): Promise<boolean> {
  const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  return response.ok;
}

async function rawApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    cache: "no-store",
    credentials: "include",
  });

  const data = await parseResponseData(response);

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  try {
    return await rawApiRequest<T>(path, options);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }

    if (error.status !== 401) {
      throw error;
    }

    if (!shouldTryRefresh(path, options)) {
      throw error;
    }

    const refreshed = await refreshAuthSession();

    if (!refreshed) {
      throw error;
    }

    return rawApiRequest<T>(path, {
      ...options,
      skipAuthRefresh: true,
    });
  }
}