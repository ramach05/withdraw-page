import { NextRequest, NextResponse } from "next/server";
import type { Withdrawal } from "@/types/withdrawal";
import { withdrawalsById, withdrawalsByIdempotencyKey } from "./mockStore";

export const POST = async (request: NextRequest) => {
  try {
    if (request.headers.get("X-Force-Error") === "true") {
      return NextResponse.json(
        { message: "Симуляция ошибки сервера (для проверки UI)" },
        { status: 500 },
      );
    }
    const idempotencyKey = request.headers.get("Idempotency-Key");

    if (!idempotencyKey) {
      return NextResponse.json(
        { message: "Idempotency-Key required" },
        { status: 400 },
      );
    }

    if (withdrawalsByIdempotencyKey.has(idempotencyKey)) {
      const existing = withdrawalsByIdempotencyKey.get(idempotencyKey)!;

      return NextResponse.json(
        {
          message: "Заявка с таким ключом уже создана",
          withdrawalId: existing.id,
        },
        { status: 409 },
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const destination = String(body.destination ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0 || !destination) {
      return NextResponse.json(
        { message: "Invalid amount or destination" },
        { status: 400 },
      );
    }

    const id = `wd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const withdrawal: Withdrawal = {
      id,
      amount,
      destination,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    withdrawalsByIdempotencyKey.set(idempotencyKey, withdrawal);
    withdrawalsById.set(id, withdrawal);

    return NextResponse.json(withdrawal, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
