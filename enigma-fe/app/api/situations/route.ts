import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://13.233.93.2:8000";

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/api/situations`, {
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch situations" },
            { status: 502 }
        );
    }
}
