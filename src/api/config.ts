/** Базовый URL API. */
export const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : "/api";

/** Заголовки запросов (Content-Type, опционально Authorization). */
export const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_MOCK_TOKEN
      ? process.env.NEXT_PUBLIC_MOCK_TOKEN
      : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};
