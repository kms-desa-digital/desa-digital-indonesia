import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    void request
    return NextResponse.json(
        { message: "Endpoint reset password lama sudah tidak digunakan. Gunakan Firebase Auth." },
        { status: 410 }
    )
}