let loggedBackendUrl = false;

export function getBackendBaseUrl(): string {
  const raw = import.meta.env.VITE_BACKEND_URL;
  const url =
    typeof raw === "string" && raw.length > 0
      ? raw.replace(/\/+$/, "")
      : "http://localhost:8787";
  if (import.meta.env.DEV && !loggedBackendUrl) {
    loggedBackendUrl = true;
    console.log(
      "[backend] base URL =",
      url,
      "(VITE_BACKEND_URL =",
      raw ?? "<unset>",
      ")",
    );
  }
  return url;
}
