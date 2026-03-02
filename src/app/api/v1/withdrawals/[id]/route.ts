import { NextRequest, NextResponse } from "next/server";
import { withdrawalsById } from "../mockStore";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const withdrawal = withdrawalsById.get(id);

  if (!withdrawal) {
    return NextResponse.json(
      { message: "Withdrawal not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(withdrawal);
};
