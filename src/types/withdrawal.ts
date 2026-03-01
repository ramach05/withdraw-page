/** Статус заявки. */
export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/** Заявка на вывод. */
export interface Withdrawal {
  /** Идентификатор. */
  id: string;
  /** Сумма. */
  amount: number;
  /** Получатель. */
  destination: string;
  /** Статус. */
  status: WithdrawalStatus;
  /** Дата создания (ISO). */
  createdAt: string;
}

/** Тело запроса создания заявки. */
export interface CreateWithdrawalPayload {
  /** Сумма. */
  amount: number;
  /** Получатель. */
  destination: string;
}

/** Тело ответа при ошибке API. */
export interface ApiErrorBody {
  /** Сообщение для пользователя. */
  message?: string;
  /** Код ошибки. */
  code?: string;
}

/** Ошибка API вывода. */
export class WithdrawalApiError extends Error {
  constructor(
    message: string,
    /** HTTP-статус. */
    public status: number,
    /** Тело ответа. */
    public body?: ApiErrorBody,
  ) {
    super(message);
    this.name = "WithdrawalApiError";
  }
}
