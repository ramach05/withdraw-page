import { describe, it, expect, beforeEach } from "vitest";
import {
  persistLastWithdrawal,
  restoreLastWithdrawal,
} from "@/utils/lastWithdrawalStorage";
import type { Withdrawal } from "@/types/withdrawal";

const STORAGE_KEY = "withdraw_last_success";

const validWithdrawal: Withdrawal = {
  id: "wd_1",
  amount: 100,
  destination: "addr:test",
  status: "pending",
  createdAt: "2025-01-01T00:00:00.000Z",
};

describe("lastWithdrawalStorage", () => {
  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it("restore returns withdrawal after persist", () => {
    persistLastWithdrawal(validWithdrawal);
    const restored = restoreLastWithdrawal();
    expect(restored).not.toBeNull();
    expect(restored?.id).toBe(validWithdrawal.id);
    expect(restored?.amount).toBe(validWithdrawal.amount);
    expect(restored?.destination).toBe(validWithdrawal.destination);
  });

  it("restore returns null when TTL expired", () => {
    const data = {
      withdrawal: validWithdrawal,
      savedAt: Date.now() - 6 * 60 * 1000,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(restoreLastWithdrawal()).toBeNull();
  });

  it("restore returns null for invalid JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "not json");
    expect(restoreLastWithdrawal()).toBeNull();
  });

  it("restore returns null for invalid structure (missing withdrawal)", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now() }),
    );
    expect(restoreLastWithdrawal()).toBeNull();
  });

  it("restore returns null for invalid structure (wrong withdrawal shape)", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        withdrawal: { id: "x" },
        savedAt: Date.now(),
      }),
    );
    expect(restoreLastWithdrawal()).toBeNull();
  });
});
