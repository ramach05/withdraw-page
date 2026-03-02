import { create } from "zustand";
import type { StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import type { Withdrawal } from "@/types/withdrawal";

/** Статус формы вывода. */
export type WithdrawStatus = "idle" | "loading" | "success" | "error";

/** Данные полей формы. */
export interface WithdrawFormSlice {
  /** Сумма (строка). */
  amount: string;
  /** Получатель. */
  destination: string;
  /** Подтверждение вывода. */
  confirm: boolean;
  /** Симуляция ошибки API. */
  forceError: boolean;
}

/** Результат отправки. */
export interface WithdrawResultSlice {
  /** Статус UI. */
  status: WithdrawStatus;
  /** Последняя созданная заявка. */
  lastWithdrawal: Withdrawal | null;
  /** Сообщение об ошибке. */
  errorMessage: string | null;
}

/** Экшены стора. */
export interface WithdrawActions {
  setAmount: (value: string) => void;
  setDestination: (value: string) => void;
  setConfirm: (value: boolean) => void;
  setForceError: (value: boolean) => void;
  setStatus: (status: WithdrawStatus) => void;
  setLastWithdrawal: (w: Withdrawal | null) => void;
  setError: (message: string | null) => void;
  resetForm: () => void;
}

export type WithdrawState = WithdrawFormSlice &
  WithdrawResultSlice &
  WithdrawActions;

/** Начальное состояние стора Zustand. */
const initialState: WithdrawFormSlice & WithdrawResultSlice = {
  amount: "",
  destination: "",
  confirm: false,
  forceError: false,
  status: "idle",
  lastWithdrawal: null,
  errorMessage: null,
};

/** Селекторы стора. */
export const selectAmount = (s: WithdrawState) => s.amount;
export const selectDestination = (s: WithdrawState) => s.destination;
export const selectConfirm = (s: WithdrawState) => s.confirm;
export const selectForceError = (s: WithdrawState) => s.forceError;
export const selectStatus = (s: WithdrawState) => s.status;
export const selectLastWithdrawal = (s: WithdrawState) => s.lastWithdrawal;
export const selectErrorMessage = (s: WithdrawState) => s.errorMessage;

export const selectFormActions = (s: WithdrawState) => ({
  setAmount: s.setAmount,
  setDestination: s.setDestination,
  setConfirm: s.setConfirm,
  setForceError: s.setForceError,
});

export const selectSubmitActions = (s: WithdrawState) => ({
  setStatus: s.setStatus,
  setLastWithdrawal: s.setLastWithdrawal,
  setError: s.setError,
});

const storeImpl = (
  set: (partial: Partial<WithdrawState>) => void,
): WithdrawState => ({
  ...initialState,
  setAmount: (value: string) => set({ amount: value }),
  setDestination: (value: string) => set({ destination: value }),
  setConfirm: (value: boolean) => set({ confirm: value }),
  setForceError: (value: boolean) => set({ forceError: value }),
  setStatus: (status: WithdrawStatus) => set({ status }),
  setLastWithdrawal: (lastWithdrawal: Withdrawal | null) =>
    set({ lastWithdrawal }),
  setError: (errorMessage: string | null) => set({ errorMessage }),
  resetForm: () => set({ ...initialState }),
});

const storeWithMiddleware =
  process.env.NODE_ENV === "development"
    ? (devtools(storeImpl, {
        name: "WithdrawStore",
      }) as StateCreator<WithdrawState>)
    : storeImpl;

export const useWithdrawStore = create<WithdrawState>()(storeWithMiddleware);
