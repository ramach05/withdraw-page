import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useWithdrawStore,
  selectAmount,
  selectDestination,
  selectConfirm,
  selectStatus,
  selectForceError,
  selectSubmitActions,
} from "@/store/withdrawStore";
import { createWithdrawal } from "@/api/withdrawalsApi";
import { generateIdempotencyKey } from "@/utils/idempotency";
import {
  isWithdrawFormValid,
  getAmountNumber,
  type WithdrawFormValues,
} from "@/utils/validation";
import { WithdrawalApiError } from "@/types/withdrawal";
import { persistLastWithdrawal } from "@/utils/lastWithdrawalStorage";

const MIN_LOADING_MS = 400;

/** Задержка для минимального показа лоадера. */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Хук отправки формы: валидация, API с idempotency key и AbortController, обновление стора. */
export const useWithdrawSubmit = () => {
  const amount = useWithdrawStore(selectAmount);
  const destination = useWithdrawStore(selectDestination);
  const confirm = useWithdrawStore(selectConfirm);
  const status = useWithdrawStore(selectStatus);
  const forceError = useWithdrawStore(selectForceError);
  const { setStatus, setLastWithdrawal, setError } = useWithdrawStore(
    useShallow(selectSubmitActions),
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const submit = useCallback(async () => {
    const values: WithdrawFormValues = { amount, destination, confirm };

    if (!isWithdrawFormValid(values)) return;
    if (status === "loading") return;

    const amountNum = getAmountNumber(values);

    if (amountNum === null || amountNum <= 0) return;

    const idempotencyKey = generateIdempotencyKey();
    setError(null);
    setStatus("loading");

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const loadingStartedAt = Date.now();

    try {
      const withdrawal = await createWithdrawal(
        { amount: amountNum, destination: values.destination.trim() },
        idempotencyKey,
        { forceError, signal: controller.signal },
      );
      const elapsed = Date.now() - loadingStartedAt;

      if (elapsed < MIN_LOADING_MS) {
        await delay(MIN_LOADING_MS - elapsed);
      }

      setLastWithdrawal(withdrawal);
      setStatus("success");
      persistLastWithdrawal(withdrawal);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const elapsed = Date.now() - loadingStartedAt;

      if (elapsed < MIN_LOADING_MS) {
        await delay(MIN_LOADING_MS - elapsed);
      }

      const message =
        err instanceof WithdrawalApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Произошла ошибка. Попробуйте ещё раз.";

      setError(message);
      setStatus("error");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [
    amount,
    destination,
    confirm,
    status,
    forceError,
    setStatus,
    setLastWithdrawal,
    setError,
  ]);

  // Отмена запроса при размонтировании компонента.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { submit, status };
};
