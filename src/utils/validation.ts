/** Значения формы вывода. */
export interface WithdrawFormValues {
  /** Сумма. */
  amount: string;
  /** Получатель. */
  destination: string;
  /** Подтверждение. */
  confirm: boolean;
}

/** Ошибки валидации по полям. */
export interface WithdrawFormErrors {
  /** Ошибка поля «Сумма». */
  amount?: string;
  /** Ошибка поля «Получатель». */
  destination?: string;
  /** Ошибка подтверждения. */
  confirm?: string;
}

/** Парсит строку в число (запятая → точка). */
const parseAmount = (value: string): number | null => {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
};

/** Валидирует форму, возвращает ошибки по полям. */
export const validateWithdrawForm = (
  values: WithdrawFormValues,
): WithdrawFormErrors => {
  const errors: WithdrawFormErrors = {};

  const amountNum = parseAmount(values.amount);

  if (values.amount.trim() === "") {
    errors.amount = "Укажите сумму";
  } else if (amountNum === null) {
    errors.amount = "Некорректное число";
  } else if (amountNum <= 0) {
    errors.amount = "Сумма должна быть больше нуля";
  }

  if (!values.destination.trim()) {
    errors.destination = "Укажите получателя";
  }

  if (!values.confirm) {
    errors.confirm = "Подтвердите вывод средств";
  }

  return errors;
};

/** Все поля валидны. */
export const isWithdrawFormValid = (values: WithdrawFormValues): boolean => {
  const errors = validateWithdrawForm(values);

  return Object.keys(errors).length === 0;
};

/** Число из поля «Сумма» или null. */
export const getAmountNumber = (values: WithdrawFormValues): number | null => {
  return parseAmount(values.amount);
};
