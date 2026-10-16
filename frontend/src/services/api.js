const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "");

export const apiUrl = (path) => `${API_BASE_URL}${path}`;