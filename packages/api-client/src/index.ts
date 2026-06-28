import { isDefined } from "@moja/shared";

export type HeaderInput =
  | Record<string, string>
  | Array<[string, string]>
  | Headers;

export interface ApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeaderInput;
  getAuthToken?: () => string | undefined;
}

export interface ApiRequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeaderInput;
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function buildQueryString(
  query: Record<string, string | number | boolean | null | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (!isDefined(value)) {
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}

function applyHeaders(target: Headers, input?: HeaderInput) {
  if (!input) {
    return;
  }

  if (input instanceof Headers) {
    input.forEach((value, key) => {
      target.set(key, value);
    });
    return;
  }

  if (Array.isArray(input)) {
    for (const [key, value] of input) {
      target.set(key, value);
    }
    return;
  }

  for (const [key, value] of Object.entries(input)) {
    target.set(key, value);
  }
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request<TResponse>(
    path: string,
    requestOptions: ApiRequestOptions = {},
  ): Promise<TResponse> {
    const url = `${options.baseUrl.replace(/\/$/, "")}${path}${buildQueryString(
      requestOptions.query ?? {},
    )}`;
    const headers = new Headers();
    applyHeaders(headers, options.defaultHeaders);
    applyHeaders(headers, requestOptions.headers);

    const token = options.getAuthToken?.();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const hasBody = requestOptions.body !== undefined;
    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const requestInit: NonNullable<Parameters<typeof fetchImpl>[1]> = {
      method: requestOptions.method ?? "GET",
      headers,
    };

    if (hasBody) {
      requestInit.body = JSON.stringify(requestOptions.body);
    }

    if (requestOptions.signal) {
      requestInit.signal = requestOptions.signal;
    }

    const response = await fetchImpl(url, requestInit);

    const contentType = response.headers.get("content-type");
    const payload = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === "string" && payload.length > 0
          ? payload
          : `Request failed with status ${response.status}`;
      throw new ApiClientError(message, response.status, payload);
    }

    return payload as TResponse;
  }

  return {
    request,
    get<TResponse>(
      path: string,
      requestOptions?: Omit<ApiRequestOptions, "method" | "body">,
    ) {
      return request<TResponse>(path, { ...requestOptions, method: "GET" });
    },
    post<TResponse>(
      path: string,
      body?: unknown,
      requestOptions?: Omit<ApiRequestOptions, "method" | "body">,
    ) {
      return request<TResponse>(path, {
        ...requestOptions,
        method: "POST",
        body,
      });
    },
    put<TResponse>(
      path: string,
      body?: unknown,
      requestOptions?: Omit<ApiRequestOptions, "method" | "body">,
    ) {
      return request<TResponse>(path, {
        ...requestOptions,
        method: "PUT",
        body,
      });
    },
    patch<TResponse>(
      path: string,
      body?: unknown,
      requestOptions?: Omit<ApiRequestOptions, "method" | "body">,
    ) {
      return request<TResponse>(path, {
        ...requestOptions,
        method: "PATCH",
        body,
      });
    },
    delete<TResponse>(
      path: string,
      requestOptions?: Omit<ApiRequestOptions, "method" | "body">,
    ) {
      return request<TResponse>(path, { ...requestOptions, method: "DELETE" });
    },
  };
}
