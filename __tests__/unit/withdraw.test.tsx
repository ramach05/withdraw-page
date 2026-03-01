import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WithdrawForm } from "@/components/WithdrawForm";
import { useWithdrawStore } from "@/store/withdrawStore";

const originalFetch = globalThis.fetch;

describe("WithdrawForm", () => {
  beforeEach(() => {
    useWithdrawStore.setState({
      amount: "",
      destination: "",
      confirm: false,
      status: "idle",
      lastWithdrawal: null,
      errorMessage: null,
      forceError: false,
    });

    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it("happy path: submit valid form shows success and withdrawal data", async () => {
    const user = userEvent.setup();
    const mockWithdrawal = {
      id: "wd_123",
      amount: 100,
      destination: "wallet:0xabc",
      status: "pending" as const,
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWithdrawal),
    });

    render(<WithdrawForm />);

    await user.type(screen.getByLabelText(/сумма/i), "100");
    await user.type(screen.getByLabelText(/получатель/i), "wallet:0xabc");
    await user.click(
      screen.getByRole("checkbox", { name: /подтверждаю вывод/i }),
    );
    await user.click(screen.getByRole("button", { name: /отправить/i }));

    await waitFor(() => {
      expect(screen.getByText(/заявка создана/i)).toBeInTheDocument();
    });
    expect(screen.getByText(mockWithdrawal.id)).toBeInTheDocument();
    expect(screen.getByText(String(mockWithdrawal.amount))).toBeInTheDocument();
    expect(screen.getByText(mockWithdrawal.destination)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/withdrawals"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ amount: 100, destination: "wallet:0xabc" }),
      }),
    );
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(call?.headers).toBeDefined();
    expect(
      (call?.headers as Record<string, string>)["Idempotency-Key"],
    ).toBeDefined();
  });

  it("API error: shows error message and keeps form data", async () => {
    const user = userEvent.setup();
    const errorResponse = {
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Server error" }),
    };
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse);

    render(<WithdrawForm />);

    await user.type(screen.getByLabelText(/сумма/i), "50");
    await user.type(screen.getByLabelText(/получатель/i), "addr:xyz");
    await user.click(
      screen.getByRole("checkbox", { name: /подтверждаю вывод/i }),
    );
    await user.click(screen.getByRole("button", { name: /отправить/i }));

    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(screen.getByDisplayValue("addr:xyz")).toBeInTheDocument();
  });

  it("double submit: POST called only once when submit clicked twice while loading", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: void | PromiseLike<void>) => void = () => {};
    const createPromise = new Promise<void>((resolve) => {
      resolveCreate = resolve;
    });
    globalThis.fetch = vi.fn().mockReturnValue(
      createPromise.then(() => ({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "wd_1",
            amount: 10,
            destination: "d",
            status: "pending",
            createdAt: new Date().toISOString(),
          }),
      })),
    );

    render(<WithdrawForm />);

    await user.type(screen.getByLabelText(/сумма/i), "10");
    await user.type(screen.getByLabelText(/получатель/i), "d");
    await user.click(
      screen.getByRole("checkbox", { name: /подтверждаю вывод/i }),
    );

    const submitBtn = screen.getByRole("button", { name: /отправить/i });
    await user.click(submitBtn);
    await user.click(submitBtn);

    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 600 },
    );
    resolveCreate();
  });

  it("validation: empty form shows errors and does not call API", async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn();

    render(<WithdrawForm />);
    await user.click(screen.getByRole("button", { name: /отправить/i }));

    expect(screen.getByText("Укажите сумму")).toBeInTheDocument();
    expect(screen.getByText("Укажите получателя")).toBeInTheDocument();
    expect(screen.getByText("Подтвердите вывод средств")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("validation: amount <= 0 shows error", async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn();

    render(<WithdrawForm />);
    await user.type(screen.getByLabelText(/сумма/i), "0");
    await user.type(screen.getByLabelText(/получатель/i), "addr");
    await user.click(
      screen.getByRole("checkbox", { name: /подтверждаю вывод/i }),
    );
    await user.click(screen.getByRole("button", { name: /отправить/i }));

    expect(
      screen.getByText("Сумма должна быть больше нуля"),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("409: shows API message (e.g. duplicate idempotency key)", async () => {
    const user = userEvent.setup();
    const conflictMessage = "Заявка с таким ключом уже создана";
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: conflictMessage }),
    });

    render(<WithdrawForm />);
    await user.type(screen.getByLabelText(/сумма/i), "10");
    await user.type(screen.getByLabelText(/получатель/i), "addr");
    await user.click(
      screen.getByRole("checkbox", { name: /подтверждаю вывод/i }),
    );
    await user.click(screen.getByRole("button", { name: /отправить/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(conflictMessage);
    });
  });

  it("loading: submit button is disabled and shows loading text", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: void | PromiseLike<void>) => void = () => {};
    const createPromise = new Promise<void>((resolve) => {
      resolveCreate = resolve;
    });
    globalThis.fetch = vi.fn().mockReturnValue(
      createPromise.then(() => ({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "wd_1",
            amount: 10,
            destination: "d",
            status: "pending",
            createdAt: new Date().toISOString(),
          }),
      })),
    );

    render(<WithdrawForm />);
    await user.type(screen.getByLabelText(/сумма/i), "10");
    await user.type(screen.getByLabelText(/получатель/i), "d");
    await user.click(
      screen.getByRole("checkbox", { name: /подтверждаю вывод/i }),
    );
    await user.click(screen.getByRole("button", { name: /отправить/i }));

    await waitFor(() => {
      const submitBtn = screen.getByRole("button", { name: /отправка/i });
      expect(submitBtn).toBeDisabled();
    });
    resolveCreate();
  });

  it("restore after reload: shows last withdrawal from localStorage without fetch", async () => {
    const storedWithdrawal = {
      id: "wd_restored",
      amount: 99,
      destination: "addr:restored",
      status: "pending" as const,
      createdAt: "2025-01-15T12:00:00.000Z",
    };
    const storageKey = "withdraw_last_success";
    const stored = {
      withdrawal: storedWithdrawal,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(stored));

    globalThis.fetch = vi.fn();

    render(<WithdrawForm />);

    await waitFor(() => {
      expect(screen.getByText(/заявка создана/i)).toBeInTheDocument();
    });
    expect(screen.getByText(storedWithdrawal.id)).toBeInTheDocument();
    expect(
      screen.getByText(String(storedWithdrawal.amount)),
    ).toBeInTheDocument();
    expect(screen.getByText(storedWithdrawal.destination)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    window.localStorage.removeItem(storageKey);
  });
});
