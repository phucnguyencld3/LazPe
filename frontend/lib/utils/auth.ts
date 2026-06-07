export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  if (typeof window === "undefined") return true;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;

    // Decode base64 URL-safe
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    if (payload && typeof payload.exp === "number") {
      // payload.exp is in seconds, Date.now() is in milliseconds
      return Date.now() / 1000 >= payload.exp;
    }
    return false;
  } catch (e) {
    console.error("Error checking token expiration:", e);
    return true; // Treat invalid/unparseable tokens as expired
  }
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // Dispatch a custom event to notify other components (like Header) that auth state changed
    window.dispatchEvent(new Event("auth-change"));
  }
}

export function getValidToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return null;

  if (isTokenExpired(token)) {
    clearAuth();
    return null;
  }

  return token;
}

export function setupFetchInterceptor(): void {
  if (typeof window === "undefined") return;

  // Prevent duplicate wrapping
  if ((window as any).__fetchWrapped) return;
  (window as any).__fetchWrapped = true;

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    if (response.status === 401) {
      // Token is unauthorized/expired on backend
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        console.warn("API returned 401. Clearing expired token.");
        clearAuth();

        // If they are on an admin page, redirect them to login
        if (window.location.pathname.startsWith("/admin")) {
          window.location.replace("/login");
        }
      }
    }

    return response;
  };
}

// Auto-run fetch interceptor on client-side loading
if (typeof window !== "undefined") {
  setupFetchInterceptor();
}
