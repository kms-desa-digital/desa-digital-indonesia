import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  void request
  return NextResponse.json(
    {
      message:
        "Endpoint login API sudah tidak digunakan. Gunakan Firebase Auth langsung dari client.",
    },
    { status: 410 }
  )
}