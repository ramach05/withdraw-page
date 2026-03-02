import type { Withdrawal } from "@/types/withdrawal";

const STORAGE_KEY = "withdraw_last_success";
const TTL_MS = 5 * 60 * 1000; // 5 минут

interface Stored {
  /** Последняя успешная заявка. */
  withdrawal: Withdrawal;
  /** Время сохранения. */
  savedAt: number;
}

/** Сохраняет последнюю успешную заявку (только в браузере). */
export const persistLastWithdrawal = (withdrawal: Withdrawal): void => {
  if (typeof window === "undefined") return;

  try {
    const data: Stored = { withdrawal, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

/** Восстанавливает последнюю заявку, если не старше TTL. */
export const restoreLastWithdrawal = (): Withdrawal | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw) as Stored;

    if (
      !data?.withdrawal ||
      typeof data.savedAt !== "number" ||
      Date.now() - data.savedAt > TTL_MS
    ) {
      return null;
    }

    const w = data.withdrawal;

    if (
      typeof w?.id !== "string" ||
      typeof w?.amount !== "number" ||
      typeof w?.destination !== "string" ||
      typeof w?.status !== "string" ||
      typeof w?.createdAt !== "string"
    ) {
      return null;
    }

    return w as Withdrawal;
  } catch {
    return null;
  }
};
