import { NextRequest, NextResponse } from "next/server";

/** @deprecated Use POST /api/v1/ai/complete instead. */
export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use POST /api/v1/ai/complete instead.",
      successor: "/api/v1/ai/complete",
    },
    {
      status: 410,
      headers: {
        Deprecation: "true",
        Link: '</api/v1/ai/complete>; rel="successor-version"',
      },
    }
  );
}
