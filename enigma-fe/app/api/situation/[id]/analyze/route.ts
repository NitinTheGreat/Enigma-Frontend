import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://13.233.93.2:8000";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const role = request.nextUrl.searchParams.get("role") || "ANALYST";

    try {
        const res = await fetch(
            `${API_URL}/api/situation/${id}/analyze?role=${role}`,
            { cache: "no-store" }
        );
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            { error: "Failed to analyze situation" },
            { status: 502 }
        );
    }
}
