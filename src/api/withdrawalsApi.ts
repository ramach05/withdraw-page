import { API_BASE, getAuthHeaders } from "./config";
import type {
  Withdrawal,
  CreateWithdrawalPayload,
  ApiErrorBody,
} from "@/types/withdrawal";
import { WithdrawalApiError } from "@/types/withdrawal";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/** Задержка для симуляции сетевой задержки. */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const parseErrorResponse = async (
  response: Response,
): Promise<ApiErrorBody> => {
  try {
    const data = await response.json();

    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
};

/** Опции создания заявки. */
export interface CreateWithdrawalOptions {
  /** Симулировать ошибку API (для UI). */
  forceError?: boolean;
  /** Сигнал отмены запроса (AbortController.signal). */
  signal?: AbortSignal;
}

/** Создаёт заявку (POST), идемпотентность по ключу. Retry при сетевой ошибке и при 5xx (до 3 попыток). */
export const createWithdrawal = async (
  payload: CreateWithdrawalPayload,
  idempotencyKey: string,
  options?: CreateWithdrawalOptions,
): Promise<Withdrawal> => {
  const url = `${API_BASE}/v1/withdrawals`;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    "Idempotency-Key": idempotencyKey,
  };
  if (options?.forceError) {
    headers["X-Force-Error"] = "true";
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: options?.signal,
      });

      if (response.ok) {
        const data: Withdrawal = await response.json();

        return data;
      }

      const body = await parseErrorResponse(response);
      const message = body.message ?? `Ошибка запроса (${response.status})`;
      const apiError = new WithdrawalApiError(message, response.status, body);

      if (response.status < 500) throw apiError;

      lastError = apiError;

      if (attempt >= MAX_RETRIES - 1) throw lastError;

      await delay(RETRY_DELAY_MS);
    } catch (err) {
      if (err instanceof WithdrawalApiError) throw err;

      if (err instanceof Error && err.name === "AbortError") throw err;

      lastError = err instanceof Error ? err : new Error(String(err));
      const isNetwork =
        err instanceof TypeError && err.message?.includes("fetch");

      if (!isNetwork || attempt >= MAX_RETRIES - 1) {
        throw lastError;
      }

      await delay(RETRY_DELAY_MS);
    }
  }

  throw lastError ?? new Error("Не удалось создать заявку");
};

/** Загружает заявку по id. */
export const getWithdrawal = async (
  id: string,
  options?: { signal?: AbortSignal },
): Promise<Withdrawal> => {
  const url = `${API_BASE}/v1/withdrawals/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    signal: options?.signal,
  });

  if (!response.ok) {
    const body = await parseErrorResponse(response);

    throw new WithdrawalApiError(
      body.message ?? `Ошибка загрузки заявки (${response.status})`,
      response.status,
      body,
    );
  }

  const data: Withdrawal = await response.json();

  return data;
};
