const ENV_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || "";

function buildURL(base, path) {
  if (!base) {
    throw new Error(
      "No se configuró la URL base del API. Define NEXT_PUBLIC_API_BASE o NEXT_PUBLIC_API_URL."
    );
  }

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function api(path, { method = "POST", body, headers } = {}) {
  const url = buildURL(ENV_BASE, path);
  const token = (typeof window !== "undefined")
    ? (localStorage.getItem("token") || sessionStorage.getItem("token"))
    : null;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || data?.message || "Error de servidor";
    const error = new Error(message);
    if (data && typeof data === "object") {
      error.data = data;
    }
    error.status = res.status;
    throw error;
  }
  return data;
}

function decodeSegment(segment) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");

  if (typeof window === "undefined") {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(base64, "base64").toString("utf8");
    }
    const binary = globalThis.atob ? globalThis.atob(base64) : "";
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }

  const binary = window.atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

export function decodeJWT(token) {
  if (!token || typeof token !== "string") {
    return {};
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) return {};

    const json = decodeSegment(payload);
    return JSON.parse(json);
  } catch (err) {
    return {};
  }
}
