"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useWithdrawStore,
  selectAmount,
  selectDestination,
  selectConfirm,
  selectStatus,
  selectLastWithdrawal,
  selectErrorMessage,
  selectForceError,
  selectFormActions,
} from "@/store/withdrawStore";
import {
  validateWithdrawForm,
  isWithdrawFormValid,
  type WithdrawFormValues,
} from "@/utils/validation";
import { useWithdrawSubmit } from "@/hooks/useWithdrawSubmit";
import { debounce } from "@/utils/debounce";
import { restoreLastWithdrawal } from "@/utils/lastWithdrawalStorage";
import styles from "./WithdrawForm.module.css";

const SUBMIT_DEBOUNCE_MS = 400;

/** Форма вывода: сумма, получатель, подтверждение, отправка. */
const WithdrawFormInner = () => {
  const amount = useWithdrawStore(selectAmount);
  const destination = useWithdrawStore(selectDestination);
  const confirm = useWithdrawStore(selectConfirm);
  const status = useWithdrawStore(selectStatus);
  const lastWithdrawal = useWithdrawStore(selectLastWithdrawal);
  const errorMessage = useWithdrawStore(selectErrorMessage);
  const forceError = useWithdrawStore(selectForceError);
  const { setAmount, setDestination, setConfirm, setForceError } =
    useWithdrawStore(useShallow(selectFormActions));
  const resetForm = useWithdrawStore((s) => s.resetForm);
  const { submit } = useWithdrawSubmit();
  const submitRef = useRef(submit);
  submitRef.current = submit;

  const debouncedSubmit = useMemo(
    () =>
      debounce(() => {
        submitRef.current();
      }, SUBMIT_DEBOUNCE_MS),
    [],
  );

  const values = useMemo<WithdrawFormValues>(
    () => ({ amount, destination, confirm }),
    [amount, destination, confirm],
  );
  const errors = useMemo(() => validateWithdrawForm(values), [values]);
  const isValid = useMemo(() => isWithdrawFormValid(values), [values]);
  const isSubmitting = status === "loading";
  const isSubmitDisabled = !isValid || isSubmitting;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitDisabled) return;
      debouncedSubmit();
    },
    [isSubmitDisabled, debouncedSubmit],
  );

  // Восстановление последней заявки при загрузке страницы.
  useEffect(() => {
    const restored = restoreLastWithdrawal();

    if (restored) {
      useWithdrawStore.getState().setLastWithdrawal(restored);
      useWithdrawStore.getState().setStatus("success");
    }
  }, []);

  return (
    <div className={styles.sectionWrap}>
      <section className={styles.section} aria-labelledby="withdraw-heading">
        <h2 id="withdraw-heading" className={styles.title}>
          Вывод средств
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset disabled={isSubmitting} className={styles.fieldset}>
            <p>
              <label htmlFor="withdraw-amount">
                Сумма <span>*</span>
              </label>
              <input
                id="withdraw-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmount(e.target.value)
                }
              />
              <span
                id="amount-error"
                className={
                  errors.amount
                    ? `${styles.errorSlot} ${styles.errorText}`
                    : styles.errorSlot
                }
                role={errors.amount ? "alert" : undefined}
              >
                {errors.amount ?? "\u00A0"}
              </span>
            </p>
            <p>
              <label htmlFor="withdraw-destination">
                Получатель <span>*</span>
              </label>
              <input
                id="withdraw-destination"
                type="text"
                autoComplete="off"
                value={destination}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDestination(e.target.value)
                }
              />
              <span
                id="destination-error"
                className={
                  errors.destination
                    ? `${styles.errorSlot} ${styles.errorText}`
                    : styles.errorSlot
                }
                role={errors.destination ? "alert" : undefined}
              >
                {errors.destination ?? "\u00A0"}
              </span>
            </p>
            <p>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirm(e.target.checked)
                  }
                />
                Подтверждаю вывод средств
              </label>
              <span
                id="confirm-error"
                className={
                  errors.confirm
                    ? `${styles.errorSlot} ${styles.errorText}`
                    : styles.errorSlot
                }
                role={errors.confirm ? "alert" : undefined}
              >
                {errors.confirm ?? "\u00A0"}
              </span>
            </p>
            <p>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={forceError}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForceError(e.target.checked)
                  }
                />
                Симулировать ошибку запроса
              </label>
            </p>
            <p>
              <button type="submit" disabled={isSubmitDisabled}>
                {isSubmitting ? "Отправка…" : "Отправить"}
              </button>
            </p>
          </fieldset>
        </form>

        {status === "loading" && (
          <div
            className={styles.loaderOverlay}
            role="status"
            aria-live="polite"
          >
            <div className={styles.spinner} aria-hidden />
            <p className={styles.loaderText}>Отправка заявки…</p>
          </div>
        )}

        {status === "error" && errorMessage && (
          <div role="alert" className={styles.alert}>
            {errorMessage}
          </div>
        )}

        {status === "success" && lastWithdrawal && (
          <div role="status" className={styles.successBlock}>
            <h3 className={styles.successTitle}>Заявка создана</h3>
            <p>
              <strong>ID:</strong> {lastWithdrawal.id}
            </p>
            <p>
              <strong>Сумма:</strong> {lastWithdrawal.amount}
            </p>
            <p>
              <strong>Получатель:</strong> {lastWithdrawal.destination}
            </p>
            <p>
              <strong>Статус:</strong> {lastWithdrawal.status}
            </p>
            <p>
              <button
                type="button"
                onClick={resetForm}
                className={styles.newRequestBtn}
              >
                Новая заявка
              </button>
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export const WithdrawForm = React.memo(WithdrawFormInner);
