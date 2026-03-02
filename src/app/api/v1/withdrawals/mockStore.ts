import type { Withdrawal } from "@/types/withdrawal";

export const withdrawalsById = new Map<string, Withdrawal>();
export const withdrawalsByIdempotencyKey = new Map<string, Withdrawal>();
